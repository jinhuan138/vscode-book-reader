type VSCode = {
  postMessage: (message: any) => void
  getState(): any
  setState(state: any): void
}
let vscode: VSCode | null = null
export default function useVscode(): VSCode | null {
  const acquireVsCodeApi = (window as any).acquireVsCodeApi
  if (!vscode && typeof acquireVsCodeApi != 'undefined') {
    vscode = acquireVsCodeApi()
  }
  return vscode
}
