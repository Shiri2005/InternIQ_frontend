import Navbar from "../components/Navbar";
import { staticFileUrl } from "../services/api";

/** Optional page: open with ?path=/certificates/your-file.pdf to open the designed PDF in a new context */
export default function Certificate() {
  const params = new URLSearchParams(window.location.search);
  const pathParam = params.get("path");
  const pdfHref = pathParam ? staticFileUrl(decodeURIComponent(pathParam)) : "";

  return (
    <>
      <Navbar />

      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-cyan-50">
        <div className="max-w-lg rounded-2xl border border-cyan-500/25 bg-slate-900/80 p-8 text-center">
          <h1 className="text-xl font-semibold">Certificate</h1>
          {pdfHref ? (
            <a
              href={pdfHref}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-white hover:bg-emerald-500"
            >
              Open certificate PDF
            </a>
          ) : (
            <p className="mt-4 text-sm text-cyan-200/70">
              Add a query like{" "}
              <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">
                ?path=%2Fcertificates%2Fcert_....pdf
              </code>{" "}
              or use <strong>View certificate</strong> on your project page.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
