/**
 * The address a store page should treat itself as being on. The prerendered home page reports
 * "/index" on the server but "/" in the browser, and menus that disagree break hydration.
 */
export function storePath(pathname: string): string {
  return pathname === "/index" ? "/" : pathname;
}
