// import 'katex/dist/katex.min.css'; // Import KaTeX CSS
// import { all, create } from 'mathjs'; // Import create and all from mathjs
// import { useEffect, useState } from 'react';
// import { BlockMath } from 'react-katex'; // Import BlockMath for displaying equations

// // Create a math.js instance with all functions
// const math = create(all);

// function MathJS() {
//   // State for the mathematical expression, using LaTeX for fraction and a multi-line example
//   const [expression, setExpression] = useState('\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}');
//   const [result, setResult] = useState(''); // State for the calculation result
//   const [error, setError] = useState(''); // State for any errors during evaluation

//   // Example LaTeX strings for guidance
//   const exampleLatex1 = 'sum_{n=1}^{infty} frac{1}{n^2}';
//   const exampleLatex2 = '\\\\int_0^1 x^2 dx';
//   const exampleLatex3 = 'e^{ipi} + 1 = 0';

//   /**
//    * Handles the change event of the textarea.
//    * @param {Object} event - The event object from the textarea.
//    */
//   interface ExpressionChangeEvent {
//     target: {
//       value: string;
//     };
//   }

//   const handleExpressionChange = (event: ExpressionChangeEvent): void => {
//     setExpression(event.target.value);
//     // Clear previous result and error when expression changes
//     setResult('');
//     setError('');
//   };

//   /**
//    * Evaluates the mathematical expression using Math.js.
//    * Note: Math.js evaluates standard mathematical syntax, not LaTeX.
//    * This function attempts a simple conversion for fractions.
//    * For more complex LaTeX, a dedicated parser would be needed.
//    */
//   const evaluateExpression = () => {
//     try {
//       // Basic conversion: replace \frac{num}{den} with (num/den) for Math.js evaluation
//       // Also remove newlines as Math.js expects a single expression string for simple evaluation
//       const evaluableExpression = expression.replaceAll(/\\frac{(\w+)}{(\w+)}/g, '($1/$2)').replaceAll(/\n/g, ' '); // Replace newlines with spaces for evaluation

//       console.log('Evaluating expression:', evaluableExpression); // Debugging log
//       // Attempt to evaluate, Math.js might not handle all LaTeX constructs directly
//       const calculatedResult = math.evaluate(evaluableExpression);
//       setResult(calculatedResult.toString()); // Convert result to string for display
//       setError(''); // Clear any previous errors
//     } catch (err) {
//       // Catch and display any errors during evaluation
//       setResult('');
//       if (err instanceof Error) {
//         setError(`Error: ${err.message}`);
//       } else {
//         setError('An unknown error occurred.');
//       }
//     }
//   };

//   // Evaluate the expression initially and whenever it changes
//   useEffect(() => {
//     // A small delay to avoid evaluating on every keystroke,
//     // though for a simple editor, immediate feedback might be desired.
//     const handler = setTimeout(() => {
//       // Only attempt evaluation if the expression is not empty
//       if (expression.trim() !== '') {
//         evaluateExpression();
//       } else {
//         setResult('');
//         setError('');
//       }
//     }, 300); // Debounce for 300ms

//     return () => {
//       clearTimeout(handler);
//     };
//   }, [expression]); // Re-run effect when expression changes

//   return (
//     <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
//       <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl flex flex-col md:flex-row gap-8">
//         {/* Left Panel: Editor Input */}
//         <div className="flex-1">
//           <h2 className="text-2xl font-bold text-gray-800 mb-4">LaTeX Editor</h2>
//           <label htmlFor="expression-editor" className="block text-gray-700 text-sm font-semibold mb-2">
//             Type your mathematical expression here (LaTeX):
//           </label>
//           <textarea
//             id="expression-editor"
//             value={expression}
//             onChange={handleExpressionChange}
//             className="w-full h-48 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono text-base resize-y"
//             placeholder="e.g., \frac{d}{dx} (x^2) = 2x"
//             spellCheck="false"
//           />
//           <p className="text-sm text-gray-500 mt-2">Supports standard LaTeX syntax for rendering.</p>
//         </div>

//         {/* Right Panel: Rendered Output and Evaluation */}
//         <div className="flex-1 border-t md:border-t-0 md:border-l border-gray-200 pt-8 md:pt-0 md:pl-8">
//           <h2 className="text-2xl font-bold text-gray-800 mb-4">Rendered Output & Evaluation</h2>

//           {/* Display the input expression as a formatted equation using KaTeX */}
//           <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md overflow-x-auto">
//             <p className="font-semibold text-blue-800 mb-2">Formatted Equation:</p>
//             {/* BlockMath is good for standalone equations */}
//             {expression.trim() ? (
//               <BlockMath math={expression} />
//             ) : (
//               <p className="text-gray-500 italic">Start typing to see the equation rendered.</p>
//             )}
//           </div>

//           <button
//             onClick={evaluateExpression}
//             className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
//           >
//             Evaluate Expression (Math.js)
//           </button>

//           {/* {result && ( */}
//           <div className="mt-6 p-4 bg-green-100 border border-green-300 text-green-800 rounded-md">
//             <p className="font-semibold">Math.js Result:</p>
//             <p className="break-words">
//               <BlockMath math={result} />
//             </p>
//           </div>
//           {/* )} */}

//           {error && (
//             <div className="mt-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-md">
//               <p className="font-semibold">Error:</p>
//               <p className="break-words">{error}</p>
//             </div>
//           )}

//           <div className="mt-8 text-sm text-gray-500 text-center">
//             <p>
//               Equation rendering by{' '}
//               <a
//                 href="https://katex.org/"
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="text-blue-500 hover:underline"
//               >
//                 KaTeX
//               </a>
//             </p>
//             <p>
//               Calculation by{' '}
//               <a
//                 href="https://mathjs.org/"
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="text-blue-500 hover:underline"
//               >
//                 Math.js
//               </a>
//             </p>
//             <p className="mt-2">
//               Try LaTeX expressions like: `{exampleLatex1}`, `{exampleLatex2}`, `{exampleLatex3}`
//             </p>
//             <p className="mt-1">
//               For evaluation, Math.js expects standard math syntax (e.g., `2 + 3/4 * x`). Complex LaTeX might not be
//               directly evaluable.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default MathJS;

export default function MathJS() {
  return (
    <div>
      <div>MathJS</div>
    </div>
  );
}
