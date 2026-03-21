import textFileIcon from 'assets/windowsIcons/character-txt-icon.png';

import Notepad from './Notepad';

const CHARACTER_DOCUMENT_WINDOW = {
  width: 500,
  height: 360,
};

const CHARACTER_DOCUMENT_OFFSET = {
  x: 190,
  y: 85,
};

const CHARACTER_DOCUMENTS = [
  {
    id: 19,
    fileName: 'intro.txt',
    rowOffset: 0,
    windowSize: {
      width: 816,
      height: 798,
    },
    body: `thinko (plural thinkos)

	1. (slang) A careless mistake made in thinking.


ive been using the nickname "microck" for +14 years. pretty much since day 1 i gained access to the internet. fast-forward to 2023-24, where I decided to change my name in Discord to "5" for reasons I wont explain here. I needed a forgettable, common name; and what meets those requirements more than a number? a ton of people are named 5 on the internet. you wouldnt think twice about me if you saw me chatting on a public room. thats exactly what I was looking for: anonymity. peace, even.

i then named my first original character [quarzite](https://quarzite.micr.dev). born and created from the desire of wanting to "humanize" my internet persona. but these last few years, the barrier between my internet-self and my irl-self has been deteriorating. i have met wonderful (and awful) people thanks to the internet. people i can call close friends, and whom i even met up with a few times in real life (so much for "dont talk to strangers on the internet"!). my internet persona wasnt isolated from my irl one anymore. quarzite, my initial "escape", didnt resonate with me anymore; and thats when i realized that there wasnt anything actually blocking me from characterizing my actual self.

but... how can I name it? "5" looks clean, but its kinda weird as a character name. just a number. i dont like it.

Lelouch from Code Geass named himself (or his ideals) "zero", from the number "0" of course. should I name myself "five"? no no of course not, thats terrible. but what if it was in my native language, spanish?

"cinco"

thats better. but it still doesnt have a soul. its still, inherently, just a number. i guess i achieved my initial goal way too well.

what if I changed or removed some letters?

"zinco":  the word looks ugly, doesnt convince me
"zinc": on the topic of minerals, i guess it wouldve paired well with "quarzite". but how do you pronounce it? /zɪŋk/, but some people may pronounce it as /sɪŋk/. i dont want to be mistaken for a kitchen sink. what would "force" people to pronounce it correctly?
"think": no room for pronunciation error with this one; but we are back to square one: just like "cinco" and "five" were already common words, "think" is no exception. its also quite forgettable. it doesnt tell me anything. but wait, what if...

"thinko" 

deep down, its still "5". youre saying it when you pronounce it. its memorable, its unique. even the already existing word fits well with my personality. this is perfect`,
  },
  {
    id: 20,
    fileName: 'appearance.txt',
    rowOffset: 1,
    windowSize: {
      width: 961,
      height: 680,
    },
    body: `just like I mentioned in intro.txt, i wanted this character to resemble my irl-self more closely. so thats what i did. this character is literally me.

dyed red mod cut, brown eyes with eyebags, eyebrow piercing and a lip piercing. pair it with a washed black hoodie with white and black KYS chenille patches sewn across the chest (from the brand [skinhead](https://skinhead.xxx/products/1-1-kys-hoodie). despite the name, its just a regular clothing brand lmao), some denim like the Acne Studios 2021M jeans and a solid pair of leather boots.

voilà, this could be me on any random day. even if this is technically his "uniform", i like to see him get drawn with outfits that I would actually wear irl, since im into a lot of fashion styles. sadly, most artists can't depict the clothes/outfit proportions properly (cant blame them, i wouldnt be able to differentiate different "fits" from e.g. a hoodie if i wasnt into fashion myself)

but this is really ordinary... i could add "literally anything" and thats it? fuck it then: anthropomorphism time.

it took me quite a bit to decide what animal represented me the most, but i ended up going with a fox.

so now there are 3 different versions of "thinko":
1. human
2. anthropomorphic
3. furry

thats cool.

--

due to me failing to have proper hex code colors for my characters, artists started making the hair way too dark. it looks cool, i dont mind it; but it wasnt my original vision. nor my actual hair color irl.

so im pinning the color here: [[swatch:#BB1E10]] #BB1E10. thats the red tone of my dye.

here's some extra info as well:
weight: 59kg
height: 1.77m
age: 19`,
  },
];

export const characterDocumentIcons = CHARACTER_DOCUMENTS.map(
  ({ id, fileName, rowOffset, body, windowSize }, index) => ({
    id,
    icon: textFileIcon,
    title: fileName,
    gridIndex: 100 + index,
    isFocus: false,
    desktopAnchor: {
      corner: 'top-right',
      rowOffset,
    },
    appDescriptor: {
      header: {
        icon: textFileIcon,
        title: fileName,
        buttons: ['minimize', 'close'],
      },
      component: Notepad,
      injectProps: {
        initialText: body,
        readOnly: true,
        defaultWordWrap: true,
      },
      defaultSize: windowSize || CHARACTER_DOCUMENT_WINDOW,
      defaultOffset: {
        x: CHARACTER_DOCUMENT_OFFSET.x + index * 20,
        y: CHARACTER_DOCUMENT_OFFSET.y + index * 18,
      },
      resizable: false,
      minimized: false,
      maximized: false,
      multiInstance: true,
    },
  }),
);
