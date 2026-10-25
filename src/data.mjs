const categories=[
 ['Manual Override',[1],'Choose freely. The universe is sitting this one out.','manual'],
 ['Keep House',[2,18],'Tend the place you live, one small thing at a time.','usual'],
 ['Tech Support',[3],'Give your tools and systems a little attention.','usual'],
 ['Rest',[4],'Rest is enough. Nothing needs to improve.','direct'],
 ['Connect',[5],'Reach toward someone. A small connection counts.','optional'],
 ['Create',[6,14],'Make something. There is room for an unfinished idea.','usual'],
 ['Manage Money',[7],'Give your everyday finances a little attention.','usual'],
 ['Organize',[8,16],'Make a little space, physically or mentally.','usual'],
 ['Cook',[9],'Spend some time with food, flavor, or preparation.','optional'],
 ['Move',[10,19],'Find a way to move that feels right today.','optional'],
 ['Read',[11],'Spend time with words that interest you.','optional'],
 ['Browse',[12],'Follow a thread of curiosity.','optional'],
 ['Watch',[13],'Give something worth watching your attention.','optional'],
 ['Work',[15],'Give a piece of work a manageable stretch of attention.','usual'],
 ['Reflect',[17],'Give an idea or question a little room.','optional'],
 ['Go Outside',[20],'Step into the non-human world. Walk, observe, or simply be there.','direct']];
 const names=['Clear','Build','Begin','Wander','Improve','Delight'];
 const general=['Finish or resolve one small thing.','Continue something already underway.','Start something you have been postponing.','Explore without needing a useful result.','Repair, refine, organize, or learn.','Choose the eligible activity that appeals most.'];
 const prompts={Create:['Finish one small piece of code, a build, a recipe, or a story.','Take the next step on an app, physical build, recipe, or story.','Start a small coding, building, cooking, writing, or drawing idea.','Try a variation in code, a build, a recipe, or a story.','Refine an interaction, a physical design, a recipe, or a scene.','Choose the coding, making, cooking, writing, or drawing you feel like doing.'],'Keep House':['Finish one small household job.','Continue a household project.','Start a household job you have put off.','Look around for something worth tending.','Make one thing work better.','Choose the household activity that appeals most.'],'Tech Support':['Resolve one small technical annoyance.','Continue a setup or technical project.','Start the fix you keep postponing.','Explore what one of your tools can do.','Make a tool or workflow work better.','Choose the technical project that interests you.']};
 const examples={Create:'Code a small app interaction, sketch a physical build, invent a recipe variation, or write a scene. Choose the kind of making that interests you right now.','Keep House':'Clear a surface, put away materials from a build, or make a corner more comfortable.',Rest:'Sit comfortably, close your eyes, or do very little on purpose.','Go Outside':'Notice the weather, look at the trees, or take a short walk.'};
 const createDetails=[
 'Finish one small app feature, settle a detail in a physical build, write down a recipe you have worked out, or finish a short scene.',
 'Continue an app feature you have started, make the next piece of a physical build, develop a recipe idea, or write the next part of a story.',
 'Prototype one interaction for an app idea, sketch a thing you want to build, outline a new recipe, or write the opening of a story.',
 'Try a different control in an app, sketch two ways to assemble a physical build, invent a recipe variation, or write a scene from another character’s perspective. You do not have to keep the result.',
 'Make an app interaction easier to use, refine the fit of parts in a build, adjust a recipe’s balance, or revise a passage in a story.',
 'Pick the part you want to play with: code an interaction, make something physical, invent a dish, write a scene, or draw a quick sketch.'
 ];

export {categories,names,general,prompts,examples,createDetails};
