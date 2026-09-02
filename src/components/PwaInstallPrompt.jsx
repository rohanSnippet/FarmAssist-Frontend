import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";

const isIosDevice = () => /iPad|iPhone|iPod/.test(navigator.userAgent);
const isMobileDevice = () => /Android|iPad|iPhone|iPod/.test(navigator.userAgent);

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() =>
    window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true,
  );

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  if (isInstalled || (!deferredPrompt && !isIosDevice() && !isMobileDevice())) return null;

  return (
    <aside className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-primary/20 bg-base-100 p-4 shadow-xl sm:left-auto">
      <div className="flex gap-3">
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          {deferredPrompt ? <Download size={22} /> : <Share size={22} />}
        </div>
        <div className="flex-1">
          <h2 className="font-bold">Install FarmAssist</h2>
          {deferredPrompt ? (
            <p className="mt-1 text-sm text-base-content/70">Add the app to your phone for faster, full-screen access.</p>
          ) : isIosDevice() ? (
            <p className="mt-1 text-sm text-base-content/70">In Safari, tap Share, then choose “Add to Home Screen”.</p>
          ) : (
            <p className="mt-1 text-sm text-base-content/70">The install option appears after the app is opened over HTTPS. Reload once you are on the secure site.</p>
          )}
          {deferredPrompt && (
            <button type="button" onClick={installApp} className="btn btn-primary btn-sm mt-3">
              Install app
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default PwaInstallPrompt;
