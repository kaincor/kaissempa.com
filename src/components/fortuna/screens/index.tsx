import type { ReactNode } from "react";
import * as E from "./employer";
import * as J from "./jobseeker";

/**
 * Every mockup screen by name, so the case study's text can call for one
 * ("post1", "applicants") without importing it.
 */
export const SCREENS = {
  // The job seeker.
  welcome: () => <J.Welcome />,
  phone: () => <J.PhoneNumber />,
  location: () => <J.Location />,
  waitlist: () => <J.Location waitlist />,
  onboard1: () => <J.Onboard n={1} />,
  onboard2: () => <J.Onboard n={2} />,
  onboard3: () => <J.Onboard n={3} />,
  homeNudge: () => <J.HomeNudge />,
  bioProfile: () => <J.BioProfile />,
  bioProfileVideo: () => <J.BioProfile video />,
  bioPrefs: () => <J.BioPrefs />,
  bioPrefsAny: () => <J.BioPrefs wage="No Preference" />,
  attributes: () => <J.Attributes />,
  home: () => <J.Home />,
  swipeLimit: () => <J.SwipeLimit />,
  myApplications: () => <J.MyApplications />,
  connectedEmail: () => <J.ConnectedEmail />,
  // The employer.
  ghostEmail: () => <E.GhostEmail />,
  jobsEmpty: () => <E.JobsEmpty />,
  post1: () => <E.PostStep1 />,
  post2: () => <E.PostStep2 />,
  posted: () => <E.Posted />,
  picking: () => <E.Picking />,
  applicants: () => <E.Applicants />,
  candidate: () => <E.Candidate />,
  video: () => <E.VideoPlayer />,
  schedule: () => <E.Schedule />,
  scheduleFilled: () => <E.Schedule filled />,
  connected: () => <E.Connected />,
  candidates: () => <E.Candidates />,
  // Before the video resume: the interview, as the wireframes had it.
  wireCreateInterview: () => <E.WireCreateInterview />,
  wireMyInterviews: () => <E.WireMyInterviews />,
  wirePlayAnswer: () => <E.WirePlayAnswer />,
  wireInterviewSent: () => <E.WireInterviewSent />,
} satisfies Record<string, () => ReactNode>;

export type ScreenId = keyof typeof SCREENS;

export function ScreenById({ id }: { id: ScreenId }) {
  return SCREENS[id]();
}
