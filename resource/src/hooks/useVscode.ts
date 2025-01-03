let vscode = null

export default function useVscode(): any {
  const acquireVsCodeApi = (window as any).acquireVsCodeApi;
  if (!vscode && typeof acquireVsCodeApi != 'undefined') {
    vscode = acquireVsCodeApi()
  }
  return vscode
}
