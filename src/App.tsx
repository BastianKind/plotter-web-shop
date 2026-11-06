import { useEffect, useState } from 'react';
import { Footer, Header } from './components/Header';
import { HelpDialog } from './components/HelpDialog';
import { ToastProvider } from './components/Toast';
import { Checkout } from './pages/Checkout';
import { ChoosePaper } from './pages/ChoosePaper';
import { Design } from './pages/Design';
import { Recipients } from './pages/Recipients';
import { ThankYou } from './pages/ThankYou';
import { ShopProvider, useShop } from './state/shop';

function Shell() {
  const { state } = useShop();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [state.step]);

  let page;
  switch (state.step) {
    case 'recipients':
      page = <Recipients />;
      break;
    case 'design':
      page = <Design />;
      break;
    case 'checkout':
      page = <Checkout />;
      break;
    case 'done':
      page = <ThankYou />;
      break;
    default:
      page = <ChoosePaper />;
  }

  return (
    <div className="app">
      <Header onHelp={() => setHelpOpen(true)} />
      <main className="main" key={state.step}>
        {page}
      </main>
      <Footer />
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ShopProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </ShopProvider>
  );
}
