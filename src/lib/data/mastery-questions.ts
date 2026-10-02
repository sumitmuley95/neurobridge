/** Shape of a mastery question as shown to the student (no correct answer). */
export interface MasteryQuestion {
  id: number;
  prompt: string;
  imageSrc?: string;
  visualEmoji?: string;
  subText?: string;
  options: { id: string; text: string; emoji: string }[];
  correctAnswer?: string; // never sent to the browser; grading happens on the server
}