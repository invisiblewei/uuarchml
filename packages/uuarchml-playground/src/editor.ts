import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { yaml } from '@codemirror/lang-yaml';

export interface Editor {
  getContent(): string;
  setContent(content: string): void;
}

export function createEditor(container: HTMLElement, initialContent: string): Editor {
  const state = EditorState.create({
    doc: initialContent,
    extensions: [
      basicSetup,
      oneDark,
      yaml(),
      EditorView.theme({
        '&': {
          height: '100%',
          fontSize: '14px'
        },
        '.cm-scroller': {
          fontFamily: 'Menlo, Monaco, "Courier New", monospace'
        }
      })
    ]
  });

  const view = new EditorView({
    state,
    parent: container
  });

  return {
    getContent(): string {
      return view.state.doc.toString();
    },
    setContent(content: string): void {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: content
        }
      });
    }
  };
}
