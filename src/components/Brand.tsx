/** Reference-faithful brand: preserve the supplied EP artwork rather than approximating with SVG. */
export function Mark(){
 return <span className="logo-mark" aria-hidden="true"><img className="ep-monogram" src="/assets/everpath-monogram.png" alt="" width={185} height={119}/></span>;
}
export function Brand(){
 return <span className="brand"><Mark/><span className="brand-word"><span className="brand-ever">EVER</span><span className="brand-path">PATH</span></span></span>;
}
