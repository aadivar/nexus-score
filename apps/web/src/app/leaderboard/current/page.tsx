import { redirect } from 'next/navigation';

export default function LegacyCurrentLeaderboardPage() {
  redirect('/leaderboard?era=current');
}
