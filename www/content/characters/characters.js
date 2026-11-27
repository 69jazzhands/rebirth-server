// People and zombies. Each name is a model in assets/chars/<name>.json (MakeHuman, glTF with the "game_engine" skeleton).
// A mod can add its own: put the file in the mod folder, add the name to a list, and point to it in "files".
Rebirth.content.characters = {
  player: 'Worker_Male',
  shopkeeper: 'OldClassy_Male',
  survivorsMale: ['Casual_Male', 'Casual2_Male', 'Casual3_Male', 'Suit_Male', 'Worker_Male'],
  survivorsFemale: ['Casual_Female', 'Casual2_Female', 'Casual3_Female', 'Worker_Female'],
  zombiesMale: ['Zombie_Male', 'Zombie_Male2', 'Zombie_Male3', 'Zombie_Male4'],   // bitten neck, mauled, bitten arm, long dead
  zombiesFemale: ['Zombie_Female', 'Zombie_Female2'],                            // bitten leg, bitten neck
  files: {}   // name -> path, for models that live somewhere else (e.g. inside a mod folder)
};
