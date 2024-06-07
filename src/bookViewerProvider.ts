import * as vscode from "vscode";
import { readFileSync } from "fs";
import { resolve } from "path";

class Util {
	public static buildPath(
		data: string,
		webview: vscode.Webview,
		contextPath: string
	): string {
		return data
			.replace(/((src|href)=("|')?)(\/\/)/gi, "$1http://")
			.replace(
				/((src|href)=("|'))((?!(http))[^"']+?\.(css|js|properties|json|png|jpg))\b/gi,
				"$1" + webview.asWebviewUri(vscode.Uri.file(`${contextPath}`)) + "/$4"
			);
	}

	public static listen(
		webviewPanel: vscode.WebviewPanel,
		uri: vscode.Uri,
		callback: () => void,
		disposeCallback?: () => void
	) {
		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
			(e) => {
				if (e.document.uri.toString() === uri.toString()) {
					callback();
				}
			}
		);
		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
		});
	}
}

export class BookViewerProvider implements vscode.CustomReadonlyEditorProvider {
	private extensionPath: string;

	constructor(context: vscode.ExtensionContext) {
		this.extensionPath = context.extensionPath;
	}

	public openCustomDocument(
		uri: vscode.Uri,
		openContext: vscode.CustomDocumentOpenContext
	): vscode.CustomDocument | Thenable<vscode.CustomDocument> {
		return { uri, dispose: (): void => {} };
	}

	public resolveCustomEditor(
		document: vscode.CustomDocument,
		webviewPanel: vscode.WebviewPanel
	): void | Thenable<void> {
		const uri = document.uri;
		const webview = webviewPanel.webview;
		const folderPath = vscode.Uri.file(resolve(uri.fsPath, ".."));
		webview.options = {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.file(this.extensionPath), folderPath],
		};
		webview.onDidReceiveMessage(async () =>
			webview.postMessage({
				type: "open",
				content: webview.asWebviewUri(uri).toString(),
			})
		);
		webview.html = Util.buildPath(readFileSync(this.extensionPath + "/resource/dist/index.html", 'utf8'), webview, this.extensionPath + "/resource/dist");
	}
}
