import * as vscode from 'vscode';

const jsLocatorString = '<script>';
const cssLocatorString = '<style';

export function activate(context: vscode.ExtensionContext) {
	const goHTML = vscode.commands.registerCommand('extension.goHTML', (editor) => handler('','HTML'));
	const goJS = vscode.commands.registerCommand('extension.goJS', (editor) => handler(jsLocatorString,'JS'));
	const goCSS = vscode.commands.registerCommand('extension.goCSS', (editor) => handler(cssLocatorString, 'CSS'));

	context.subscriptions.push(goHTML, goJS, goCSS);
}

function handler(searchstring: string, type: string) {
	new Promise((resolve, reject) => {
		// Get current active code editor
	   	const textEditor = vscode.window.activeTextEditor;

		if (!textEditor) {
			vscode.window.showWarningMessage('No Editor found');	
			return;
		};
		const os = require('os');
		
		// Grab whole text:string 
		const text = getText(0, textEditor.document.lineCount - 1, textEditor);

		if(type === 'JS'){
			// Search index of <script> or <style>
			const currentLine = textEditor.selection.active.line;
			const textBeforeCursor = getText(0, currentLine, textEditor);
			const indexOfScriptTag = searchString(textBeforeCursor, "<script>", "First");

			if(indexOfScriptTag > -1){
				// In <script> or <style>
				const indexOfFound = searchString(text, searchstring, "First");
				jumpTo(indexOfFound, textEditor);
			} else {
				// In HTML
				const currentLineStr = text.split(os.EOL)[currentLine];

				if(currentLineStr.includes('@') || currentLineStr.includes('v-model')){
					const indexStart = currentLineStr.indexOf('"');
					const indexEnd = currentLineStr.lastIndexOf('"');
					const varieble = currentLineStr.substring(indexStart + 1, indexEnd);
					// Find <script> index
					const indexOfScriptTag = searchString(text,  "<script>", "First");
					const indexOfEndScriptTag = searchString(text,  "</script>", "First");

					const jsText = getText(indexOfScriptTag, indexOfEndScriptTag, textEditor);
					const variebleIndex = searchString(jsText,  varieble, "First");

					jumpTo(variebleIndex+indexOfScriptTag, textEditor);

				} else { 
					const indexOfFound = searchString(text, searchstring, "First");
					jumpTo(indexOfFound, textEditor);
				} 
			}
		}

		if(type === 'CSS'){
			// Search index of <script> or <style>
			const indexOfFound = searchString(text, searchstring, "Last");
			jumpTo(indexOfFound, textEditor);
		}

		if(type === 'HTML'){
			// get current cursor at line 
			const currentLine = textEditor.selection.active.line;

			//TODO -1 is a temporary fix
			const textBeforeCursor = getText(0, currentLine , textEditor);
			const indexOfFound = searchString(textBeforeCursor, "<style ", "First");
			
			if(indexOfFound > 0){
				// In Css area
				const cssText = getText(indexOfFound, currentLine, textEditor);

				const lastCssNameIndex =  searchString(cssText, " {", "Last");

				const cssNameRaw = cssText.split(os.EOL)[lastCssNameIndex];

				if(cssNameRaw){
					// In CSS => found .name before cursor
					// If there is any tag name before cursor
					const cssIndexStart = cssNameRaw.indexOf('.');
					const cssIndexEnd = cssNameRaw.lastIndexOf(' ');
					const cssName = cssNameRaw.substring(cssIndexStart+1,cssIndexEnd);

					const htmlIndex = searchString(text,`class="${cssName}"`, "Last");

					if(htmlIndex > 0){
						// In CSS => found .name before cursor => found cssname in html
						jumpTo(htmlIndex, textEditor);
					} else {
						// In CSS => found .name before cursor => no cssname in html
						jumpTo(0, textEditor);
					}
				} else {
					// In CSS => but no .name before cursor
					jumpTo(0, textEditor);
				}
				
			} else {
				// Anywhere not in Css area, go back to top.
				jumpTo(0, textEditor);
			}
			// if  not in the <style tag
				// Go top
		}	
	});
}


function jumpTo(toLine: number, textEditor: vscode.TextEditor){
	const currentPosition = textEditor.selection.active;
	const newPosition = currentPosition.with(toLine, 0);
	const newSelection = new vscode.Selection(newPosition, newPosition);
	textEditor.selection = newSelection;
	
	// Jump to the new position
	const revealType = vscode.TextEditorRevealType.AtTop;
	textEditor.revealRange(new vscode.Range(newPosition, newPosition), revealType);
}

function searchString(text: string, searchstring: string, mode: string){
	let indexOfFound = -1;
	const os = require('os');

	// commentout because no way stop
	// text.split(os.EOL).forEach((x,i) =>{
	// 	if(x.includes(searchstring)){
	// 		indexOfFound = i;
	// 	}
	// });
	const array = text.split(os.EOL);

	for( let i = 0 ; i < array.length ; i++){
		if( array[i].includes(searchstring) ){
			indexOfFound = i;

			if(mode === "First"){
				break;
			}
		}
	}

	return indexOfFound;
}

function getText(firstLineNumber: number, lastLineNumber: number, textEditor: vscode.TextEditor){
	const firstLine = textEditor.document.lineAt(firstLineNumber);
	const lastLine = textEditor.document.lineAt(lastLineNumber);
	const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
	const text = textEditor.document.getText(textRange);
	return text;
}
// this method is called when your extension is deactivated
export function deactivate() {
	return;
}
