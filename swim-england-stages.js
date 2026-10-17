export const swimEnglandSource = 'https://www.swimming.org/learntoswim/swim-england-learn-to.swim-awards-1-7/';

export const swimEnglandStages = {
  'Stage 1': [
    'Enter the water safely',
    'Travel forwards for 5 metres, with or without feet on the floor',
    'Travel backwards for 5 metres, with or without feet on the floor',
    'Travel sideways for 5 metres, with or without feet on the floor',
    'Scoop water and wash the face',
    'Remain comfortable when water is showered overhead',
    'Return to standing from a flat back float',
    'Return to standing from a flat front float',
    'Push from the wall and glide flat on the front',
    'Push from the wall and glide flat on the back',
    'Name two pool safety rules',
    'Leave the water safely'
  ],
  'Stage 2': [
    'Jump safely into the water from poolside',
    'Blow bubbles rhythmically three times with the mouth and nose underwater',
    'Return to standing from a flat back float without support',
    'Return to standing from a flat front float without support',
    'Push from the wall and glide on the back',
    'Push from the wall and glide on the front with arms extended',
    'Use a recognised leg kick to travel 5 metres on the back without flotation equipment',
    'Use a recognised leg kick to travel 5 metres on the front without flotation equipment',
    'Tuck-rotate from a front float to a back float, then stand',
    'Tuck-rotate from a back float to a front float, then stand',
    'Log roll from back to front',
    'Log roll from front to back',
    'Leave the water without support'
  ],
  'Stage 3': [
    'Jump from poolside and fully submerge',
    'Sink, push away from the wall and hold a streamlined position',
    'Push and glide on the front, then log roll onto the back',
    'Push and glide on the back, then log roll onto the front',
    'Travel 5 metres on the front, tuck-rotate and return on the back',
    'Submerge fully and retrieve an object',
    'Identify three key water-safety messages',
    'Push, glide and travel 10 metres on the back',
    'Push, glide and travel 10 metres on the front',
    'Hold a tuck float for three seconds',
    'Leave the water without using the steps'
  ],
  'Stage 4': [
    'Show at least three changing shapes while floating on the surface',
    'Push and glide from the wall towards the pool floor',
    'Kick backstroke for 10 metres',
    'Kick front crawl for 10 metres',
    'Kick butterfly for 10 metres on the front or back',
    'Kick breaststroke for 10 metres on the front',
    'Scull head-first for 5 metres while flat on the back',
    'Travel on the back and log roll continuously onto the front',
    'Travel on the front and log roll continuously onto the back',
    'Push, glide and swim 10 metres using a chosen stroke'
  ],
  'Stage 5': [
    'Perform a stationary flat scull on the back',
    'Scull feet-first for 5 metres while flat on the back',
    'Complete a 30–45 second partner sculling sequence that includes rotation',
    'Tread water for 30 seconds',
    'Perform three differently shaped jumps into deep water',
    'Push, glide and swim 10 metres backstroke to the expected standard',
    'Push, glide and swim 10 metres front crawl to the expected standard',
    'Push, glide and swim 10 metres breaststroke to the expected standard',
    'Push, glide and swim 10 metres butterfly to the expected standard',
    'Hold a handstand for at least three seconds',
    'Perform a forward somersault',
    'Demonstrate how to get help in an emergency'
  ],
  'Stage 6': [
    'Give two ways to prepare for exercise and explain their importance',
    'Sink, push from the wall on the side, glide, kick and rotate into backstroke',
    'Sink, push from the wall on the side, glide, kick and rotate into front crawl',
    'Swim 10 metres while wearing clothes',
    'Swim front crawl with at least six rhythmical breaths after a push and glide',
    'Swim breaststroke with at least six rhythmical breaths after a push and glide',
    'Swim butterfly with at least three rhythmical breaths after a push and glide',
    'Swim backstroke with at least six regular breaths after a push and glide',
    'Push, glide and swim 25 metres in a chosen stroke to the expected standard',
    'Perform a shout-and-signal rescue',
    'Perform a surface dive'
  ],
  'Stage 7': [
    'Push, glide and swim 25 metres backstroke to the expected standard',
    'Push, glide and swim 25 metres front crawl to the expected standard',
    'Push, glide and swim 25 metres breaststroke to the expected standard',
    'Push, glide and swim 25 metres butterfly to the expected standard',
    'Complete a one-minute group sequence combining strokes, sculling, rotation, floating or eggbeater skills',
    'Perform a sitting dive or standing dive',
    'Push, glide and swim 50 metres continuously using one stroke',
    'Push, glide and swim 100 metres using at least three strokes',
    'Tread water using eggbeater action for 30 seconds',
    'Complete an obstacle course using at least four objects without touching the pool floor'
  ]
};

export const stageOutcomeId = (stage, index) => `${stage.toLowerCase().replace(' ', '-')}-${index + 1}`;
