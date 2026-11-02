import type { IRunResult } from './run-result';

/**
 * Nothing here runs until a learner presses Run: the worker, and with it the Pyodide download from
 * the CDN, is created on the first runPython() call, and CodeBlock imports this module only then.
 *
 * Pyodide 0.27 ships CPython 3.12.7, the Python every course program was checked with, so what a
 * learner sees on Run matches the lesson. A newer line (314.x is Python 3.14) words some errors
 * differently.
 */
const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js';

/** Long enough for a real program, short enough that an infinite loop does not hang the page. */
const TIME_LIMIT_MS = 10_000;

/**
 * The worker: loads Pyodide once, then runs each program the way the course build does
 * (.course-agent harness.py): a fresh __main__ module, input() answered from the given lines and
 * echoed as a terminal shows it, and an error reported as its last line.
 */
const WORKER_SOURCE = `
importScripts(${JSON.stringify(PYODIDE_URL)});
const HARNESS = String.raw\`
import builtins, contextlib, io, sys, traceback, types

def run_script(code, answers):
    queue = list(answers)
    buffer = io.StringIO()
    def fake_input(prompt=""):
        if not queue:
            raise EOFError("input() needs a value: type it in the Input box under the code")
        answer = queue.pop(0)
        buffer.write(f"{prompt}{answer}\\n")
        return answer
    saved_input, saved_main = builtins.input, sys.modules.get("__main__")
    builtins.input = fake_input
    module = types.ModuleType("__main__")
    module.__file__ = "main.py"
    sys.modules["__main__"] = module
    error = None
    with contextlib.redirect_stdout(buffer):
        try:
            exec(compile(code, "main.py", "exec"), module.__dict__)
        except SystemExit:
            pass
        except BaseException as exc:
            error = traceback.format_exception_only(type(exc), exc)[-1].strip()
        finally:
            builtins.input = saved_input
            sys.modules["__main__"] = saved_main
    return {"stdout": buffer.getvalue(), "error": error}
\`;
const ready = loadPyodide().then((pyodide) => {
  pyodide.runPython(HARNESS);
  self.postMessage({ type: 'ready' });
  return pyodide;
});
self.onmessage = async (event) => {
  const pyodide = await ready;
  const run = pyodide.globals.get('run_script');
  const result = run(event.data.code, pyodide.toPy(event.data.stdin)).toJs({ dict_converter: Object.fromEntries });
  run.destroy();
  self.postMessage({ type: 'result', stdout: result.stdout, error: result.error });
};
`;

let worker: Worker | null = null;
let isLoaded = false;

const getWorker = () => {
  if (!worker) {
    const url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: 'text/javascript' }));
    worker = new Worker(url);
    isLoaded = false;
  }
  return worker;
};

/** Ends the worker; the next run starts a fresh one (and loads Pyodide again). */
const resetWorker = () => {
  worker?.terminate();
  worker = null;
  isLoaded = false;
};

/** True once Pyodide has loaded in this page, so the first run can say it is downloading. */
export const isPythonLoaded = () => isLoaded;

/** Ends the run in progress, if any, as stopped. Only one Python program runs at a time. */
let stopActive: (() => void) | null = null;

/**
 * Runs a Python program in the shared worker. `onStatus('loading')` fires while Pyodide downloads
 * on the first run. A program that runs past the time limit, is stopped, or is still running when
 * another block starts one is ended by ending the worker.
 */
export const runPython = (
  code: string,
  stdin: string[],
  onStatus: (status: 'loading' | 'running') => void,
): Promise<IRunResult> =>
  new Promise((resolve) => {
    stopActive?.();
    const current = getWorker();
    onStatus(isLoaded ? 'running' : 'loading');
    let timer: number | undefined;
    const finish = (result: IRunResult) => {
      window.clearTimeout(timer);
      current.removeEventListener('message', onMessage);
      if (stopActive === stop) stopActive = null;
      resolve(result);
    };
    const stop = () => {
      resetWorker();
      finish({ stdout: '', error: null, isStopped: true });
    };
    const onMessage = (event: MessageEvent<{ type: string; stdout?: string; error?: string | null }>) => {
      if (event.data.type === 'ready') {
        isLoaded = true;
        onStatus('running');
        timer = window.setTimeout(stop, TIME_LIMIT_MS);
        return;
      }
      finish({ stdout: event.data.stdout ?? '', error: event.data.error ?? null, isStopped: false });
    };
    current.addEventListener('message', onMessage);
    current.addEventListener(
      'error',
      () => {
        resetWorker();
        finish({
          stdout: '',
          error: 'Python could not be loaded. Check the internet connection and try again.',
          isStopped: false,
        });
      },
      { once: true },
    );
    stopActive = stop;
    if (isLoaded) timer = window.setTimeout(stop, TIME_LIMIT_MS);
    current.postMessage({ code, stdin });
  });

/** Stops the running program now (the Stop button). */
export const stopPython = () => stopActive?.();
