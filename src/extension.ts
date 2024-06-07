import * as vscode from "vscode";
import { BookViewerProvider } from "./bookViewerProvider";

//https://rackar.github.io/vscode-ext-doccn
//https://code.visualstudio.com/api
//https://juejin.cn/post/7208370120850079799#heading-31
export function activate(context: vscode.ExtensionContext) {
	console.log('激活')
	const option = {
		webviewOptions: { retainContextWhenHidden: true, enableFindWidget: true },
	};
	vscode.window.registerCustomEditorProvider(
		"bookReader",
		new BookViewerProvider(context),
		option
	);
}
