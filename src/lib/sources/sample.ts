import type { RawPosting } from "../jobs/types";
import { samplePostings } from "./sample-data";

export function loadSamplePostings(): RawPosting[] {
  return samplePostings;
}
