import { Modal } from './Modal';

const FAQ: [string, string][] = [
  ['How does plotter work?', 'You write your note here. In our studio a machine holds a real pen and writes it on 300 gsm ivory paper. Then we post it for you.'],
  ['Is it really ink?', 'Yes. Every note is written with a real pen, line by line. No printer is involved, so you can feel the ink on the paper.'],
  ['How long does it take?', 'Most orders are written within 2–3 working days and sent by A-Post. Larger bulk orders can take a day or two longer.'],
  ['Can it write in my own handwriting?', 'Yes. Choose “Your own handwriting”. After you order, we send you a short template to fill in once, and we use it for all your notes.'],
  ['Can I send many cards at once?', 'Yes. On the first page choose “Sending to many” and upload a list from Excel. Every card greets its recipient by name.'],
  ['Do you write signatures?', 'No. A signature should always come from you, so we leave room for it or write your name instead.'],
  ['What happens to my addresses?', 'We use them only to write and send your cards, and delete the list 30 days after delivery.'],
];

export function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="A little help" footer={<p className="muted small">Still stuck? Write to hello@plotter.studio. This is a prototype, so the address isn’t monitored.</p>}>
      <div className="faq">
        {FAQ.map(([q, a], i) => (
          <details key={q} open={i === 0}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </Modal>
  );
}
