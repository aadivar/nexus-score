import { ArrowUpRight } from 'lucide-react';
import styles from './new-home-badge.module.css';

export function NewHomeBadge() {
  return (
    <a
      href="https://annexis.org"
      target="_blank"
      rel="noopener noreferrer"
      className={styles.badge}
      aria-label="Nexus-Index has a new home. Visit Annexis at annexis.org (opens in a new tab)"
    >
      <svg
        className={styles.ring}
        viewBox="0 0 200 200"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <path
            id="annexis-new-home-ring"
            d="M 100,100 m -79,0 a 79,79 0 1,1 158,0 a 79,79 0 1,1 -158,0"
          />
        </defs>
        <text>
          <textPath href="#annexis-new-home-ring" textLength="496" lengthAdjust="spacing">
            NEXUS-INDEX HAS A NEW HOME · NEXUS-INDEX HAS A NEW HOME ·{' '}
          </textPath>
        </text>
      </svg>
      <span className={styles.centre} aria-hidden="true">
        <span className={styles.eyebrow}>Now at</span>
        <span className={styles.wordmark}>Annexis</span>
        <ArrowUpRight className={styles.arrow} strokeWidth={1.5} />
      </span>
    </a>
  );
}
