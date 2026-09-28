/**
 * Runs before first paint (inlined in <head>): marks <html class="lite"> on
 * devices that announce themselves as weak — little memory, few cores, a
 * data-saver or a 2g/3g link — or that PerfGuard already caught stuttering
 * on an earlier visit. Lite keeps the look but drops the costly parts:
 * the smoke shader stands still, the header loses its live blur, half the
 * fireflies go, nothing animates through a filter.
 */
export const LITE_BOOT = `(function(){try{var d=document.documentElement,n=navigator,c=n.connection||{},m=n.deviceMemory,h=n.hardwareConcurrency,s=null;try{s=localStorage.getItem("vidmar-lite")}catch(e){}if(s==="1"||c.saveData||/(^|-)(2g|3g)$/.test(c.effectiveType||"")||(m&&m<=2)||(h&&h<=2)||(m&&m<=4&&h&&h<=4))d.classList.add("lite")}catch(e){}})();`;

export const LITE_EVENT = "vidmar:lite";

export function isLite() {
  return document.documentElement.classList.contains("lite");
}
