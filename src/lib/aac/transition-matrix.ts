// Trained Markov transition model: P(next card | last card).
// Copied verbatim from standalone_autism_module/ml/models/transition_matrix.json

export const TRANSITION_MATRIX: Record<string, Record<string, number>> = {
  "i_want": {
    "drink_water": 0.1667,
    "eat_food": 0.1667,
    "play_toys": 0.1667,
    "take_break": 0.1667,
    "read_book": 0.0833,
    "go_bathroom": 0.0833,
    "brush_teeth": 0.0833,
    "wash_hands": 0.0833
  },
  "drink_water": {
    "thank_you": 1.0
  },
  "eat_food": {
    "thank_you": 0.5,
    "drink_water": 0.5
  },
  "play_toys": {
    "thank_you": 1.0
  },
  "take_break": {
    "feel_calm": 0.6667,
    "rest_sleep": 0.3333
  },
  "i_feel": {
    "feel_anxious": 0.3333,
    "feel_sad": 0.25,
    "feel_calm": 0.25,
    "feel_happy": 0.1667
  },
  "feel_happy": {
    "play_toys": 1.0
  },
  "feel_sad": {
    "help_please": 0.5,
    "take_break": 0.5
  },
  "feel_anxious": {
    "take_break": 0.3333,
    "help_please": 0.3333,
    "rest_sleep": 0.3333
  },
  "feel_calm": {
    "read_book": 0.5,
    "play_toys": 0.5
  },
  "i_need": {
    "help_please": 0.2222,
    "take_break": 0.2222,
    "go_bathroom": 0.2222,
    "rest_sleep": 0.1111,
    "drink_water": 0.1111,
    "eat_food": 0.1111
  },
  "help_please": {
    "thank_you": 1.0
  },
  "go_bathroom": {
    "wash_hands": 1.0
  },
  "brush_teeth": {
    "wash_hands": 1.0
  },
  "wash_hands": {
    "eat_food": 1.0
  }
};
