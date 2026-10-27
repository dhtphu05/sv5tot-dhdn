/**
 * 5TOT ĐHĐN — Development / QA Mode Guard Hook
 *
 * Per Prompt 14.9 Sections 36 & 37 ("DEV TOOLS VS DEMO TOOLS" & "REMOVE OLD DEV CONTROLS"):
 * - Stakeholders must NEVER see Dev tooling (QA Public Entry, Debug Grid,
 *   developer state panels, raw state names, fixture IDs).
 * - Only the polished Prototype Demo Mode (/demo launcher + discreet Demo toolbar)
 *   is used for stakeholder demonstration.
 */

export function setDevQaMode(_enabled: boolean): void {
  // Dev tooling disabled in stakeholder prototype mode
}

export function useDevQaMode(): [boolean, (next: boolean) => void] {
  return [false, setDevQaMode];
}
