import { Layout } from '@enums';
import { Editor } from '@modules/editor';

function EditorPage() {
  return <Editor />;
}

EditorPage.layout = Layout.SIDEBAR;

export default EditorPage;
