import { SearchForm } from "@/components/layout/Navbar";

/** Below desktop width search hides behind a header icon, so on the home page it sits here too. */
export function HomeSearch() {
  return (
    <div className="container-page py-2 lg:hidden">
      <SearchForm />
    </div>
  );
}
