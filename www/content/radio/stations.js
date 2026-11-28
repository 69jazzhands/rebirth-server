// Radio stations. Tune with the RADIO button (wheel on phones, Y / N keys on PC, MENU with a controller, or in any car).
//   freq / name   what the dial shows
//   kind          talk (a host reading lines), music (a song made live in code, with a DJ between songs),
//                 alert (warning tones, then messages), cb (survivors calling in, static between), numbers (a voice reading numbers)
//   signal        0..1, how clean the station comes in (lower = more static)
//   bed           talk stations only: a quiet music bed under the voice ('drone', 'pad' or none)
//   style         music stations only: 'oldies', 'rock' or 'lowlight'
//   voices        who speaks: { id: { pitch, rate, pick } }. pick chooses among the device's voices so characters sound different.
//   lines         what they say. Plain strings are read by the station's first voice; [voiceId, text] picks the speaker.
//   when          Eyes in the Sky only: lines that play when something is happening to you (see the list in the game's radioContext()).
//   titles        music stations: words the song titles and band names are built from (every song is made up and new).
// Add a station in a mod with Rebirth.content.radio.push({...}); the dial picks it up.
Rebirth.content.radio = [
  {
    id: 'eyes', freq: '98.1 FM', name: 'Eyes in the Sky', kind: 'talk', signal: 0.92, bed: 'pad',
    voices: { sky: { pitch: 0.95, rate: 1.06, pick: 0 } },
    intro: [
      "This is Eyes in the Sky, broadcasting from somewhere very high and very safe. Hello down there.",
      "You're tuned to Eyes in the Sky. I see the whole city from up here. Yes, including you.",
      "Eyes in the Sky, still on the air. If you can hear me, you're still alive. Congratulations, that puts you in the top ten percent.",
      "Good to have you, ground pounder. Eyes in the Sky, your only news source that never sleeps. Mostly because of the screaming."
    ],
    lines: [
      "Weather today over Denver: cloudy, with a ninety percent chance of the dead.",
      "Traffic report. Colfax is jammed. Not with cars. Try a side street.",
      "Reminder: the dead don't knock. If something knocks, that's worse. Don't answer.",
      "A listener asks if it's safe to go outside. Short answer, no. Long answer, nooooo.",
      "I've been watching a walker try to get through a revolving door for an hour. It's winning, slowly.",
      "Fun fact: a sledgehammer never runs out of ammo. Neither does common sense, but people keep leaving that at home.",
      "To whoever keeps setting off car alarms on the east side: we can all hear that. So can they.",
      "If you see a light in a window at night, it's either a survivor or bait. Bring a friend.",
      "Somebody asked what I eat up here. Canned peaches. Every day. I am begging someone to find me a different can.",
      "The sixteenth street mall is having a sale. Everything is free. The catch is everything else is also there.",
      "Remember when the worst thing about Denver was the altitude? Good times.",
      "I counted the zombies on one block this morning. Then I lost count. Then I stopped counting on purpose.",
      "Listener tip: a trader near the center of town will buy almost anything. Teeth included. Don't ask what for.",
      "Today's word of the day is perimeter. Build one.",
      "I'd play you some music, but the other stations have that covered. I'm the one who tells you where not to go.",
      "A Brute walked through a bus shelter like it was paper. I'm not saying go the other way. I'm saying go the other way faster.",
      "Some of you have started naming the zombies. Please stop. It makes the next part harder.",
      "It's quiet out there right now. I don't like quiet. Quiet means they're listening.",
      "Shout out to whoever built that wall out of car doors. It's ugly. It's working. Respect.",
      "If you're hearing this through a car speaker, so is everything within twenty meters. Just saying."
    ],
    tips: [
      "Tip from the sky: crouch and you get quiet. The dead hunt by ear as much as by eye.",
      "Your flashlight helps you see. It also helps them see you. Use it like you mean it.",
      "Screamers. Little things, big lungs. One scream and the whole block comes running. Drop them first.",
      "Stalkers vanish when they're far off. If you hear clicking and see nothing, that's your cue.",
      "Spitters keep their distance and lob acid. Close the gap or break line of sight.",
      "Brutes hit like a truck and take a magazine to drop. Don't trade blows. Keep moving.",
      "Got bitten? A medkit clears the infection, but only if you use it in time. Clock's ticking.",
      "Opening your bag or talking to the trader buys you a little breathing room. Not a vacation. A breath.",
      "Cars carry more than your back can. Load the trunk, keep the fuel cans coming.",
      "Fun fact for drivers: head off one edge of the city and you'll come back on the other side. Don't ask me how. I just watch.",
      "If you go down and someone you rescued comes for you, your gear stays where you fell. Go get your backpack.",
      "Explosive barrels are a gift. Lure a crowd, then light it up. Just not while you're standing on it.",
      "Gunshots carry. A knife doesn't. Pick your noise.",
      "Survivors want a place to live. Give them walls and a roof and they'll work for you.",
      "Your radio makes noise too. Turn me down if they're close. I won't be offended."
    ],
    lore: [
      "It started at a lab in the city. A spill, an accident, a mistake, depending on who's telling it. Nobody's told it straight yet.",
      "Two doctors were working in that lab. Taylor and Thompson. Both still out there, as far as I can tell. Both say they can fix this.",
      "One of those doctors wants a cure. I'm less sure about the other one. Listen to how they talk about the dead. That tells you a lot.",
      "Someone's broadcasting on the shortwave band, signing off as Dr. T. Which one, I couldn't tell you. Maybe that's the point.",
      "There's a word for what's happening that I keep hearing from the lab people. Evolution. I hate that word now.",
      "A cure exists, or it could. That's what the notes said. Find the doctors and you find the answer. Find the wrong one and, well.",
      "Every survivor you bring home makes this city a little less dead. Keep bringing them home.",
      "There's a station way down the dial, four point six, that just counts. An old ham radio guy swears it counts streets. Probably nothing.",
      "I've seen the dead stop, all at once, and look up. Like they heard something none of us can. Then they go back to it. Sleep well."
    ],
    when: {
      horde: [
        "Whoa, whoa. Big crowd moving your way. I'd stop reading the radio and start running.",
        "I count more of them than I'd like around you. Find a choke point or find a car.",
        "That's a horde, friend. Not a group. A horde. Different word for a reason.",
        "They're converging on you from up here it looks like a drain. Don't be the drain."
      ],
      spotted: [
        "One of them has eyes on you. Break line of sight.",
        "You've been spotted. Corner, doorway, anything. Go.",
        "Something just turned your way. Yes, you."
      ],
      lowhp: [
        "You're moving like you're hurt. Patch up before you pick another fight.",
        "That limp doesn't look good from up here. Medkit. Now.",
        "Hey. Stay with me. Find cover and heal.",
        "You're bleeding. They can smell it. Probably. I'm not a scientist. Heal anyway."
      ],
      infected: [
        "You're infected. I can see it in how you're walking. Medkit, right now, while it still works.",
        "Clock's running on that bite. Use a medkit or you'll be joining the other team."
      ],
      car: [
        "Nice ride. Keep it fueled and it'll keep you alive.",
        "Driving is the fastest way across town and the loudest. Everything hears an engine.",
        "Watch for wrecks on the diagonals. And for people. And for things that used to be people.",
        "In a car you can go places on foot you can't. Like away. Away is good."
      ],
      safe: [
        "You're somewhere safe for now. Take a breath. Count your ammo.",
        "Good spot. Rest up. They'll still be out there when you're ready.",
        "Home sweet barricade."
      ],
      screamer: [
        "Screamer nearby. Kill it before it calls the whole neighborhood.",
        "I hear a Screamer close to you. You'll hear it too in a second if you don't hurry."
      ],
      brute: [
        "There's a Brute near you. Big one. Don't let it corner you.",
        "Brute on your block. That ground shaking isn't an earthquake."
      ],
      kills: [
        "That's a lot of dead dead. Nice work down there.",
        "You're thinning them out. Keep that up and the city might notice.",
        "I've started a tally for you up here. It's getting long."
      ],
      noammo: [
        "Sounds like you're out of ammo. Melee works. So does running. The trader takes silver.",
        "Click click is not the sound you want. Find ammo or find a crowbar."
      ],
      light: [
        "Your flashlight is a lighthouse right now. Every one of them can see it.",
        "Maybe kill the light. They're close."
      ],
      idle: [
        "You've been still a while. Either you're being smart or you're asleep. Both are risky.",
        "Hello? Still with me? Blink twice. I'll see it."
      ]
    }
  },
  {
    id: 'alert', freq: '162.5', name: 'Civil Alert Network', kind: 'alert', signal: 1,
    voices: { bot: { pitch: 0.55, rate: 0.88, pick: 1 } },
    lines: [
      "This is the Civil Alert Network. An emergency has been declared for the Denver metropolitan area. Remain indoors.",
      "Residents are advised to avoid contact with infected individuals. Infected individuals may appear calm. They are not calm.",
      "Evacuation centers are closed. Repeat. Evacuation centers are closed. Do not travel to evacuation centers.",
      "If you have been bitten, do not wait for symptoms. Treat the wound and isolate yourself.",
      "Conserve water. Conserve fuel. Conserve noise.",
      "Shelter in a room with one door and no ground floor windows. Barricade the door.",
      "Medical teams are working on a treatment. Information about a treatment will be broadcast on this frequency when it is available.",
      "This message is automated. If you are hearing this, the network is still operating. Staff are no longer present.",
      "Do not attempt to reason with infected family members.",
      "Lights at night attract attention. Cover windows. Use red light where possible.",
      "This has been the Civil Alert Network. This message will repeat.",
      "Curfew is in effect from sunset to sunrise. There is no sunrise exception."
    ]
  },
  {
    id: 'oldies', freq: '1340 AM', name: 'Mile High Oldies', kind: 'music', style: 'oldies', signal: 0.7,
    voices: { dj: { pitch: 1.05, rate: 1.0, pick: 2 } },
    lines: [
      "Mile High Oldies. The music never stopped. The DJ did, but the music never stopped.",
      "You're listening to Mile High Oldies on thirteen forty AM. This program is automated. Please do not call in.",
      "Mile High Oldies, the soundtrack of better days.",
      "That was a classic. Here's another one. The tape decides, not me.",
      "Coming up after this, more songs your grandparents danced to before the world ended.",
      "Mile High Oldies reminds you: a slow dance burns very few calories and makes almost no noise."
    ],
    titles: { a: ['Moonlight', 'Sugar', 'Blue', 'Midnight', 'Starlight', 'Velvet', 'Honey', 'Lonely', 'Golden', 'Silver'], b: ['on Colfax', 'Avenue', 'Serenade', 'Sweetheart', 'Rendezvous', 'Shuffle', 'Boulevard', 'Waltz', 'Dreams', 'Kiss'],
              band: ['The Larimer Four', 'Dottie and the Dials', 'The Cherry Creek Crooners', 'Lou Marlow Orchestra', 'The Platte Tones', 'Ruby Bell', 'The High Hats', 'Sammy Ward'] }
  },
  {
    id: 'rock', freq: '103.5 FM', name: 'Front Range Rock', kind: 'music', style: 'rock', signal: 0.85,
    voices: { dj: { pitch: 0.85, rate: 1.12, pick: 3 } },
    lines: [
      "Front Range Rock! Still live, still loud, still in a basement with a generator and a bad idea.",
      "This is your DJ, broadcasting from under a parking garage. If they hear this, it was worth it.",
      "That one goes out to everybody swinging a bat tonight. Keep swinging.",
      "Request line is open. And by open I mean I'll play whatever I want, because nobody's calling.",
      "Front Range Rock. Turn it up. Actually, turn it down. Actually, you decide, it's your funeral.",
      "Generator's holding. Coffee's gone. Rock continues.",
      "If anyone finds a fresh guitar string near downtown, I will trade you a can of beans and my eternal love.",
      "Next song is loud. Like the dead. But with better rhythm."
    ],
    titles: { a: ['Dead', 'Iron', 'Burning', 'Last', 'Concrete', 'Wild', 'Broken', 'Rust', 'Thunder', 'Night'], b: ['Highway', 'Machine', 'City', 'Heart', 'Run', 'Engine', 'Signal', 'Rebellion', 'Ride', 'Riot'],
              band: ['Blacktop Saints', 'The Altitude', 'Gravel Kings', 'Rotgut Radio', 'Hollow Point', 'Red Rocks Rising', 'The Last Exit', 'Static Jaw'] }
  },
  {
    id: 'lowlight', freq: '89.9 FM', name: 'Low Light', kind: 'music', style: 'lowlight', signal: 0.88,
    voices: { host: { pitch: 0.92, rate: 0.9, pick: 4 } },
    lines: [
      "This is Low Light. For everyone still awake. Which is everyone.",
      "Low Light, eighty nine point nine. Breathe slow. Keep the door locked.",
      "If you can't sleep, you're not alone. Neither are they. But you've got music.",
      "Here's something soft for a hard night.",
      "Somewhere out there, someone is listening to this same song. That's something.",
      "Low Light. Quiet music for loud times."
    ],
    titles: { a: ['Slow', 'Quiet', 'Late', 'Soft', 'Empty', 'Rain on', 'Paper', 'Distant', 'Warm', 'Small'], b: ['Hours', 'Streets', 'Window', 'Lights', 'Rooms', 'Morning', 'Glass', 'Hands', 'Echoes', 'Lanterns'],
              band: ['Nora Vale', 'Second Floor', 'The Quiet Ones', 'June Ashby', 'Lamplight', 'Small Hours Trio'] }
  },
  {
    id: 'cb', freq: 'CB 19', name: 'Survivor Channel', kind: 'cb', signal: 0.5,
    voices: { a: { pitch: 1.1, rate: 1.05, pick: 5 }, b: { pitch: 0.8, rate: 0.95, pick: 6 }, c: { pitch: 1.25, rate: 1.1, pick: 7 }, d: { pitch: 0.95, rate: 1.0, pick: 8 } },
    lines: [
      ['a', "Anybody on this channel? This is Redbird. I'm on the roof of a pharmacy. I have medicine, I need food. Over."],
      ['b', "Redbird, Big Tom here. I've got canned stuff. Name a place, not too close to the river. Over."],
      ['c', "Don't go near the stadium. I repeat, do not go near the stadium. There's thousands. Over."],
      ['d', "This is Juniper. Our group has walls up near the park. We take people who pull their weight. Over."],
      ['a', "Does anyone know if the doctor on the shortwave is real? Because I want to believe it. Over."],
      ['b', "Heard a Screamer on Broadway an hour ago. Whole street went crazy. Stay off Broadway. Over."],
      ['c', "Lost my brother near Union Station. If anyone sees a guy in a red jacket, alive, tell him Mia's waiting. Over."],
      ['d', "Trader in the center of town is still open. Prices are robbery, but he's got ammo. Over."],
      ['b', "My truck's out of gas on the diagonal. If anybody's got a can, I'll split the cargo. Over."],
      ['a', "Is it just me or are they getting faster? Some of them are running now. Running. Over."],
      ['c', "Something big just walked past my window. Like, door-frame big. I'm not moving till morning. Over."],
      ['d', "Juniper again. We've got two beds open. Bring scrap if you've got it, we're building. Over."],
      ['b', "If you hear clicking in the dark, don't go look. I'm just telling you. Don't go look. Over."],
      ['a', "Redbird here. Thanks, Big Tom. The peaches were good. Not great. Good. Over."],
      ['c', "Has anyone heard from the people at the capitol building? It went quiet three days ago. Over."],
      ['d', "Saw some idiot driving off the edge of the map last night and coming back on the other side. Wait. How. Over."],
      ['b', "Whoever's playing rock music on one oh three five, you're crazy and I love you. Over."],
      ['b', "Anybody else listen to the counting on four point six? Every night one group gets read twice. Like it matters. Over."],
      ['d', "Our camp's ham radio guy says the counting starts at Osage and Bayaud. Zero and zero. West to east, north to south. He also talks to his toaster. Over."],
      ['a', "Lights out, everybody. Stay quiet tonight. Redbird out."]
    ]
  },
  {
    id: 'lab', freq: '6.9 MHz', name: 'Shortwave: The Lab Band', kind: 'talk', signal: 0.45, bed: 'drone',
    voices: { t1: { pitch: 1.05, rate: 0.95, pick: 9 }, t2: { pitch: 0.85, rate: 0.9, pick: 10 } },
    lines: [
      ['t1', "This is Dr. T. If anyone can hear this, the work is not finished. There may still be a way back. Bring me samples."],
      ['t2', "This is Dr. T. To anyone listening. Don't be afraid of what's happening. Be curious about it."],
      ['t1', "The strain changes in the body over days, not hours. That means there is time. Time is all we need."],
      ['t2', "They don't feel pain the way we do. They don't feel fear. Ask yourself which of us is broken."],
      ['t1', "If you've collected rare tissue from the special ones, the big ones, the screaming ones, keep it. It matters."],
      ['t2', "Special tissue from the larger specimens. Collect it. Bring it to me. You'll be part of something important."],
      ['t1', "I made a mistake in that lab. I am trying to fix it. Please believe that."],
      ['t2', "There was no mistake in that lab. Only a beginning."],
      ['t1', "Dr. T, signing off. Stay human."],
      ['t2', "Dr. T, signing off. Stay open minded."],
      ['t1', "Whoever is broadcasting on this band with my name, stop. You know what you're doing. They don't."],
      ['t2', "There's another voice on this band. Don't trust everything you hear. Especially from doctors."]
    ]
  },
  {
    id: 'numbers', freq: '4.6 MHz', name: 'The Counting Station', kind: 'numbers', signal: 0.4,
    voices: { n: { pitch: 0.7, rate: 0.8, pick: 11 } },
    lines: ["Attention. Attention.", "Ready. Ready.", "End of message.", "I repeat."]
  }
];
