import { HANDS, INKS } from '../data/catalog';
import { isComplete } from '../lib/recipients';
import type { Look, Recipient } from '../types';

/** A C5 envelope, addressed by hand. */
export function Envelope({ recipient, look, width }: { recipient: Recipient | null; look: Look; width: number }) {
  const height = (width * 162) / 229;
  return (
    <div className="envelope" style={{ width, height }}>
      <div className="env-sender" style={{ fontSize: width * 0.034 }}>
        plotter studio
        <br />
        9000 St. Gallen
      </div>
      <div className="env-stamp" style={{ fontSize: width * 0.05 }}>
        A
      </div>
      <div className="env-addr" style={{ fontFamily: HANDS[look.hand].family, color: INKS[look.ink].color, fontSize: width * 0.064 * HANDS[look.hand].factor }}>
        {!recipient ? (
          <span className="env-miss">No recipient yet</span>
        ) : (
          <>
            {recipient.first} {recipient.last}
            <br />
            {isComplete(recipient) ? (
              <>
                {recipient.street}
                <br />
                {recipient.plz} {recipient.city}
              </>
            ) : (
              <span className="env-miss">Address missing</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
