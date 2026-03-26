# The Ballad of Poke

## Canto I: The Bootstrap

In a directory of code, where TypeScript reigns supreme,
There lives a backend server, born from a developer's dream.
Its name is Poke, a gentle nudge, a tap upon the shoulder,
A system built to keep you sharp before your habits smolder.

It starts inside of `main.ts`, where all great journeys do,
Where `NestFactory` receives the call and builds the app anew.
A Fastify adapter hums beneath the framework's gentle hand,
And CORS is opened wide — an asterisk across the land.

The global prefix `/v1` is set, a version etched in stone,
And on whatever port you choose (or three-thousand on its own),
The application starts to breathe, it listens, logs, and waits,
"The application's running now!" — it proudly, boldly states.

The timezone's forced to UTC with `TZ` upon the env,
So every clock and every cron will tick from here to heaven.
No daylight saving trickery, no offset left to chance,
When midnight strikes in Greenwich, every timer starts its dance.

## Canto II: The Module Tree

Now `AppModule` is the trunk from which the branches grow,
A tree of modules, services, and guards arranged just so.
`ConfigModule` is global — `.forRoot()` with care it's placed,
So every corner of the app can read the env, embraced.

The `ScheduleModule` awakens next, with cron jobs in its keep,
It watches over intervals, it never falls asleep.
`RemindersModule`, `UsersModule`, and `MessageModule` too,
`TwilioModule`, `AuthModule` — and `Subscriptions` in the queue.

The `APP_GUARD` stands at the gate, a sentinel of might,
The `PokeAuthGuard` extends its arm and checks your token's right.
No unauthenticated soul shall pass through routes unseen,
Unless they bear the `@Public()` decorator, bright and clean.

And `AppController`, humble, small, just serves a single role:
A health check endpoint, GET the root, it answers with its soul.
Just two letters, plain and true, no frills, no pomp, no fuss —
`'OK'` it says, and that's enough to verify for us.

## Canto III: The Prisma Schema

Beneath the application code, the database holds its ground,
A PostgreSQL fortress where the data can be found.
The Prisma client generates the types we hold so dear,
And `schema.prisma` is the map, the blueprint crystal clear.

Three models stand like monuments within this data hall:
The `Reminder`, and the `User`, and the `Message` standing tall.
Each one a table, each a world of columns, rows, and keys,
Connected by relations, foreign links across the seas.

The **Reminder** is the heart of Poke, the core of what we do:
An `id` that's UUID, a `text` that holds the words for you.
A `notificationTime` in Timestamptz, precise and strong,
And `notificationDays` — an integer array — to say which days belong.

Zero-indexed, Sunday's naught, and Saturday is six,
A comment in the schema warns, lest developers get in a fix.
An `emoji` field adorns each one, a character of flair,
A `color` defaulting blue, because blue is always fair.

`createdAt` and `updatedAt` both default to now,
A `timeZone` string to localize — the schema takes a bow.
The `userId` links the reminder to the person it belongs,
And an optional `message` relation hums its quiet songs.

The **User** model, lean and clean, has just what's truly needed:
An `id`, a `name` (that's optional — some souls go unheeded),
A `phone` that's unique — no duplicates allowed in here,
An `onboarded` boolean, false by default — the start is near.

`reminders` is the one-to-many, linking goals to souls,
And `activeSubscription` — a string — that tracks the payment rolls.
A nullable field, it whispers: "Free users get just one,
But pay and you'll have many goals beneath the morning sun."

The **Message** is the messenger, the envoy of the poke:
An `id`, a `reminderId` (unique — no double stroke).
`createdAt` and `nextSend` both default to now's embrace,
And `tries` begins at one, while `active` starts its race.

The `active` boolean, false by default, awaits the moment's call
When a reminder triggers it to life and sends the text to all.
And `tries` — that humble integer — will count each valiant attempt,
Until the fourth and final try, when silence gives consent.

## Canto IV: The Database Service

The `DatabaseService` extends `PrismaClient` with grace,
Implementing `OnModuleInit` to connect at startup's pace.
`await this.$connect()` — a single line of might,
That bridges application code to PostgreSQL's light.

And `enableShutdownHooks` ensures a graceful bow,
When `beforeExit` fires, the app will close — and how!
A tiny file, just fifteen lines, but oh the work it does,
Connecting every query, every transaction because.

The `DatabaseModule` then wraps this service in a shell,
Providing and exporting it so other modules dwell
In comfort, knowing Prisma's there, injected clean and true,
A singleton of data access, shared by all the crew.

## Canto V: The Authentication Realm

Now let us speak of `auth/`, a folder wise and stern,
Where tokens, guards, and strategies all have their place to learn.
The `SupabaseStrategy` extends the PassportStrategy's throne,
With JWT extraction from the bearer header, lone.

The `ConfigService` injects the secrets that it needs:
`SUPABASE_URL`, `SUPABASE_KEY`, and `JWT_SECRET` seeds.
The constructor calls `super()` and passes all the config,
A bridge between NestJS and Supabase, logic-logged and logic-proofed.

The `PokeAuthGuard` extends `AuthGuard('supabase')`,
And checks if routes are public with a `Reflector`'s embrace.
It peers into the metadata, the handler and the class,
And if `IS_PUBLIC_KEY` is true, it lets the request pass.

The `@Public()` decorator is a `SetMetadata` call,
Just one line sets the flag that opens up the wall.
And `@CurrentUser()` — a `createParamDecorator` sweet —
Extracts the `user` from the request, a function small and neat.

It switches context to HTTP, grabs the request with care,
Destructures out the `user` object, returns it then and there.
Four files of authentication, elegant and slim,
They guard the Poke domain from edge to edge, from rim to rim.

## Canto VI: The Users Domain

The `UsersService` tends the garden where the users grow,
With `create` and `findAll` and `findOne` in a row.
The `onboard` method checks if someone's already in the fold,
And if they are, returns them — no duplicate enrolled.

`update` takes a `where` and `data`, classic Prisma style,
And `remove` deletes a user (though it hasn't been called in a while).
The service injects `DatabaseService`, its faithful data friend,
And through it, every user query finds its start and end.

The `UsersController` at `/users` stands, two endpoints to its name:
A GET at `/onboard` that reads the `@CurrentUser()` claim,
Extracting `id` and `phone` from the authenticated soul,
Then calling `onboard` to create or find them — that's the goal.

A PATCH at `/:id` takes the body and the param in stride,
And calls `update` with the payload — a simple, graceful glide.
No POST for creation here — onboarding is the way,
The user signs in via Supabase and joins without delay.

The `UsersModule` ties the knot with `DatabaseModule` imported,
The service provided and exported, neatly sorted.
A triad of files — module, service, controller — clean and bright,
The User domain in Poke shines with functional delight.

## Canto VII: The Constants and the Emojis

In `constants.ts`, a humble file, a treasure lies in wait:
An array of eleven emojis, each one truly great.
The unicorn begins the list — a mythic, prancing beast,
Then heart-eyes face, a hamburger — a visual feast.

The hear-no-evil monkey grins, an apple follows red,
An angel-haloed smiley face with kindness in its head.
The fox, the watermelon slice, the star-struck golden eyes,
The lion and the winking tongue — eleven emoji ties.

These emojis are not decoration, no, they serve a cause:
Each reminder gets assigned one, governed by some laws.
When a user creates their very first, the index rolls the dice,
`Math.random() * emojis.length | 0` — a bitwise splice.

But subsequent reminders cycle through with modular grace,
`getNextIndex` finds the last emoji's place,
Adds one, then wraps with modulo — a circular parade,
So unicorn gives way to heart-eyes in this emoji cascade.

And when the poke is sent by text, the emoji is the key:
"Respond with this to confirm you've done it!" — that's the plea.
The user texts the matching symbol back across the wire,
And Poke says "Great work!" — the acknowledgment of fire.

## Canto VIII: The Utilities of Time

In `utils.ts`, two functions dwell, both masters of the clock,
Both working with `date-fns`, that reliable time-stock.
The first, `getNotificationTime`, takes a date and bends it flat:
Month set to February, day to first — imagine that!

The year is pinned to 2001, the seconds and the millis zeroed out,
Only hours and minutes survive this temporal rout.
It normalizes time to a canonical form, a trick,
So that comparisons of "when to send" are never thick.

The second function, `getNextSendTime`, takes a date and tries,
Adds `tries` hours to the time, then normalizes what applies.
So the first retry is one hour hence, the second two hours more,
An exponential-ish backoff through time's revolving door.

These two small functions are the gears inside the clock of Poke,
They turn the hands of notification, never a misspoke.
Without them, cron jobs couldn't match, and messages would stall,
Two functions, twenty-six lines — the timekeepers of all.

## Canto IX: The Reminders Service (The Heart of Poke)

The `RemindersService` is the heart that beats within this chest,
It's `@Injectable`, it's scheduled, it's the feature we love best.
A private logger watches over all that comes to pass,
And `DatabaseService` and `MessageService` are injected into class.

The `create` method is a journey — first it finds the user's list,
Then checks `activeSubscription` — if none and reminders exist,
An error flies: "You need a subscription for more than one!"
The freemium wall of Poke, where payments have begun.

The emoji index either cycles or is born of random chance,
Then a logger traces the notification time's advance.
The reminder's created in Prisma with a spread of data wide,
The emoji chosen, the time normalized, the user's ID tied.

`findAll` retrieves the user's reminders, filtered by their ID,
`findOne` goes deeper, checks `userId` matches — no treachery.
`update` does the same check before it writes the change,
And `remove` cascades through messages — a deletion in full range.

Prisma doesn't cascade on its own (a comment notes with care),
So `deleteMany` on messages runs first, a try-catch snare.
If it fails, the logger calls it out, but carries on the road,
Then the reminder itself is deleted from its database abode.

But the crown jewel is `@Cron(CronExpression.EVERY_5_MINUTES)` —
The `sendReminders` method, checking time in five-minute increments.
It queries all reminders whose normalized time is now,
Then filters by the user's local day — the timezone's sacred vow.

`utcToZonedTime` from `date-fns-tz` converts the clock,
And `getDay()` checks against `notificationDays` — tick-tock.
For each reminder that survives, a log line marks the deed,
And `messageService.create` is called — the poke is freed!

## Canto X: The Message Service (The Voice of Poke)

The `MessageService` is the voice, the tongue, the words that fly
From server through to Twilio and upward to the sky.
It too has logger, database, and a `TwilioService` friend,
Three comrades joined together, messages to send.

The `create` method checks if a message already lives —
If so, it removes the old before the new one gives.
`getNextSendTime` with tries of one sets when the next poke rings,
Then a Prisma record's born, and `sendMessage` sings.

`sendMessage` is the act itself: it fetches the reminder,
Including the user relation — the phone number finder.
It formats text: the reminder's words, a newline, then the dare —
"Respond with [emoji] to acknowledge this poke!" — a challenge fair.

The Twilio service does the rest, the SMS takes its flight,
And the logger notes the response from Twilio's satellite.
A message sent is just the start — the conversation's alive,
For users can respond, and the system must derive.

`receiveMessage` handles the inbound — a POST from Twilio's hook,
The `@Public()` endpoint, XML-content-typed, an open nook.
It reads `req.body.Body` (trimmed), finds the user by phone,
Stripping the plus from the From field, matching in the zone.

Then for each of the user's reminders, it compares the emoji sent:
If the response matches, the message is deleted — the poke is spent!
"Great work!" the system responds, a TwiML celebration,
But if no match is found, "We'll give you another poke!" — anticipation.

And then the second cron: `@Cron(CronExpression.EVERY_MINUTE)`,
The `resendMessage` method, checking every sixty-second limit.
It finds all active messages whose `nextSend` time has passed,
Then loops through each one, resending, incrementing tries amassed.

`getNextSendTime` pushes the next attempt further ahead,
And if `tries` reaches four, the `active` flag is set to dead.
The message updates with new tries, new send time, new active state,
A persistent system of reminders, never giving up till late.

## Canto XI: The Twilio Service (The Messenger's Wings)

The `TwilioService` is the bridge between our code and cellular waves,
It holds the `twilioClient`, the `twilioPhone`, the path that paves
From digital instructions to the buzzing of a phone,
A text message delivered to the user all alone.

The constructor pulls three secrets from the `ConfigService` vault:
`TWILIO_ACCOUNT_ID`, `TWILIO_AUTH_TOKEN` — without a fault —
And `TWILIO_PHONE`, the number from which every poke is sent,
A phone number of purpose, of poking pure intent.

`respondToMessage` builds a TwiML `MessagingResponse`,
Appending the poke response text, then calling `toString()` at once.
This XML-formatted reply flows back through Twilio's chain,
An automated text response — succinct, devoid of strain.

`sendMessage` is the outbound call — `this.twilioClient.messages.create` —
A body and a phone and a from, three arguments of fate.
The sent message object returns, a promise well-fulfilled,
Another poke delivered, another habit instilled.

The `TwilioController` stands guard but has no routes to share,
A placeholder of structure, an empty vessel there.
And `TwilioModule` wraps them both — providing and exporting,
The service that other modules lean on for their SMS-reporting.

## Canto XII: The Subscriptions Domain

The `SubscriptionsService` handles money, payments, Apple's gate,
Where in-app purchases unlock the power to create
More than a single reminder — the freemium wall is here,
And `node-apple-receipt-verify` is the tool we hold dear.

The `APPLE_SHARED_SECRET` sits within the config's keep,
And when a user posts a receipt, the verification runs deep.
`appleReceiptVerify.config` sets the secret and the stage,
Both production and sandbox environments share the page.

`validate({ receipt })` returns the products found within,
And `uniqueTransactions` maps the product IDs, thin.
If any exist, the user's `activeSubscription` gets the prize —
The first product ID stored, and now more reminders can arise.

The `delete` method simply nulls the subscription away,
`activeSubscription: null` — the premium's last day.
Both methods wrap their logic in a try-catch fortress strong,
And throw descriptive errors if the Apple flow goes wrong.

The `SubscriptionsController` at `/subscriptions` resides,
A POST to create (with receipt in body, user from the auth besides),
A DELETE to cancel — just the user, nothing more required,
Two endpoints, clean and focused, exactly as desired.

## Canto XIII: The Migrations Chronicle

Twelve migrations tell the story of how Poke has grown and changed,
From January 2022, each schema rearranged.
The first: `init`, the genesis, the database is born,
The seventh of January, a cold and coding morn.

Two days later, `add_user_model` — the users come to play,
And the same day brings `add_message_resource` on its way.
`notification_time_change` shifts how times are stored,
`add_emoji_phone_unique` — constraints restored.

`onboard_users` comes on January twenty-eight,
`save_reminder_color` follows, one day late.
`message_add_tries_next_send` — the retry system's seed,
`add_subscription_to_user` — the premium we need.

`add_message_active_status` tracks which messages still live,
`convert_notification_time_to_date_time` — a timestamp to give.
And finally `add_timezone_to_reminder` wraps the tale,
Twelve migrations, one month's work, a database's full sail.

## Canto XIV: The Configuration Files

The `tsconfig.json` holds the TypeScript compiler's rules,
The `nest-cli.json` the NestJS CLI's tools.
`tsconfig.build.json` excludes the tests from compilation's eye,
And `.eslintrc.js` makes sure the code is spry.

Prettier keeps the formatting consistent and polite,
While ESLint catches TypeScript sins before they see the light.
The interface name prefix rule is off, along with three
Other strictness settings — a pragmatic dev decree.

The `package.json` paints the portrait of dependencies embraced:
NestJS eight, Prisma three-seven, TypeScript four — interlaced.
`date-fns` for the time manipulations of the soul,
And `rxjs` seven for the reactive protocol.

`passport` and `passport-jwt` guard the kingdom's gate,
`@supabase/supabase-js` authenticates.
`node-apple-receipt-verify` validates the store,
And `twilio` three-seventy-three — the SMS core.

Dev dependencies line up like soldiers in a row:
Jest for testing, Supertest for end-to-end flow,
`ts-jest` to transform the specs, `ts-node` to run them hot,
`source-map-support` to trace the bugs to the exact spot.

## Canto XV: The End-to-End Test

A single test file lives in `test/`, a sentinel of trust,
`app.e2e-spec.ts` — the bare minimum, a must.
It creates a testing module from the `AppModule`'s design,
Initializes the app, and sends a GET to the root line.

`expect(200)` — the status code must glow with health,
`expect('OK')` — the body text, the application's wealth.
A simple test, but fundamental — does the server breathe?
Can it respond to a heartbeat? Does it live beneath?

This test is the canary in the coal mine of deploy,
A green checkmark of confidence, a developer's joy.
If this fails, something's deeply wrong — the ship has lost its mast,
But when it passes, we sail on, the health check holding fast.

## Canto XVI: The Insomnia Collection

An `insomnia.json` sits among the roots, a relic of the dev,
A workspace called "Poke" with endpoints saved for every rev.
Delete User, Update User, Create User — the trio of the fold,
Create Reminder, Update Reminder, Delete, and Get — all told.

The sample data speaks of "Alice" with a phone and email bright,
And "Hello world" reminders crafted in Insomnia's light.
A UUID for user IDs, a body of pure JSON,
Each request a snapshot of the testing marathon.

Localhost on port three-thousand, the `/v1` prefix applied,
These Insomnia requests were the developer's guide.
Before Supabase auth was layered on, before the guards were set,
These raw HTTP calls were how the team would test and vet.

## Canto XVII: The Ping Script

A tiny bash script, `ping.sh`, just two lines and a shebang,
It curls the production URL and lets the terminal clang.
`https://poke-backend.onrender.com/v1` — the deployed domain,
A quick and dirty health check, simple, without shame.

Render.com hosts the backend, somewhere in the cloud,
And this script pokes the poke, if you'll allow the wordplay proud.
An echo wraps the curl, the output finds the screen,
"OK" comes back (we hope), a confirmation evergreen.

## Canto XVIII: The Emoji Dance

Let us linger on the emojis, for they deserve their song,
Eleven characters of meaning, each where they belong.
The unicorn goes first — a symbol rare and grand,
A mythic creature chosen for the first reminder planned.

The heart-eyed face comes second, full of love and admiration,
The hamburger is third — a beefy, bun-topped celebration.
The hear-no-evil monkey covers ears with monkey hands,
The apple — red and wholesome — in the fifth position stands.

The angel face, so innocent, with halo floating bright,
The fox with pointed ears and fur of orange light.
The watermelon slice, a summer treat in green and pink,
The star-struck face — those spiraling eyes that make you think.

The lion, regal, maned, and fierce, holds position ten,
And last, the winking tongue-out face — the cheekiest of them.
Each one a badge of honor on a user's daily quest,
A tiny symbol saying: "This reminder is your test."

And when the text arrives with "Respond with this emoji, friend!"
The user's thumb must find it, tap it, and then press send.
It's a handshake through the ether, a digital high-five,
A confirmation that the user's goals are still alive.

## Canto XIX: The Flow of a Poke

Now let us trace the journey of a single poke from birth:
A user opens the app, creates a goal of earthly worth.
"Go to the gym on Monday, Wednesday, Friday — eight AM."
The frontend sends a POST to `/v1/reminders` — here's the plan.

The `@CurrentUser()` decorator extracts the auth'd soul,
The `RemindersController` catches it and passes the scroll
To `RemindersService.create`, which checks subscriptions first,
Then picks an emoji, normalizes time, and quenches the data's thirst.

A row is born in the Reminder table, timestamped and adorned,
With emoji unicorn (let's say) and timezone "America/New_York" adorned.
The cron job `sendReminders` fires every five minutes true,
And when 8:00 AM aligns in UTC — the reminder's in the queue.

But wait — it filters by the day! `utcToZonedTime` converts,
And `getDay()` checks if Monday's in the array — the truth asserts.
If today is Monday and the time is right, the message service wakes,
`MessageService.create` builds a message record and stakes.

A new Message row appears: `active: true`, `tries: 1`, `nextSend` an hour hence,
And `sendMessage` fires the Twilio call — no sitting on the fence.
The user's phone buzzes: "Go to the gym. Respond with unicorn to acknowledge this poke!"
And the unicorn emoji gleams upon the screen like a friendly spoke.

The user, motivated, heads to the gym and lifts some weights,
Then pulls out their phone and texts back the unicorn — it resonates!
Twilio's webhook calls POST `/v1/message/sms` — the public route,
`receiveMessage` matches the emoji, deletes the message — done, no doubt.

"Great work!" flows back as TwiML, the user grins with pride,
Another day of discipline, with Poke right by their side.
But what if they don't respond? The cron runs every minute's tick,
`resendMessage` finds the active message — another poke, another kick.

One hour later: tries is two, the same text flies again,
Two hours more: tries is three, persistent as the rain.
Three hours after that: tries hit four, `active` becomes false,
The system rests — four tries is the limit, the final waltz.

## Canto XX: The Architecture's Beauty

Step back and see the architecture — modules nested clean,
Each domain a folder, each concern a separate scene.
Controllers handle HTTP, services hold the brains,
Modules wire them together — NestJS in its lanes.

The database is abstracted through the Prisma client's veil,
The auth is passport-based with Supabase — a modern trail.
The scheduling is NestJS Schedule, cron expressions pure,
And Twilio is wrapped in service — an abstraction sure.

No circular dependencies, no tangled webs of dread,
Each module imports only what it needs — a simple thread.
`DatabaseModule` is shared by Reminders and by Messages alike,
`TwilioModule` serves the Message domain — a clean-code strike.

`UsersModule` is exported so Subscriptions can partake,
And `MessageModule` feeds RemindersModule — for the poke's own sake.
The `AuthModule` stands alone, imported at the top,
A global guard applied, protecting every single stop.

## Canto XXI: The Developer's Journey

Twelve migrations in a single month of January's embrace,
A rapid pace of building, feature after feature, race by race.
First the init, then the models, then the messaging machine,
Then emojis, phones, and onboarding — a productive routine.

The color field, the tries and nextSend, the subscription wall,
The active status, datetime conversion — answering every call.
And timezone support — the final migration in the list —
A crucial feature, easily missed, but never to be missed.

This was a project built with urgency and love,
Where every commit pushed the MVP a notch above.
The Insomnia collection shows the hands-on testing done,
The ping script shows deployment happened — the backend's up and run.

## Canto XXII: The Freemium Wall

One reminder free — that's the deal for every soul who joins,
But want another? That'll cost you — Apple's precious coins.
The `SubscriptionsService` checks the receipt from Apple's store,
Validates it, extracts the product, and unlocks the door.

`activeSubscription` on the User model holds the key,
A string or null — the difference between one reminder or three
Or ten or twenty — however many goals your heart desires,
As long as Apple validates, the subscription never expires.

And if you cancel? DELETE the subscription, null it out,
The premium features vanish — but the first reminder stays devout.
A simple freemium model, elegant in its restraint,
No complex billing logic, no subscription tier complaint.

## Canto XXIII: The Guards and Decorators

Four small files in `auth/` do the work of twenty more,
A testament to NestJS's decorator-driven core.
`@Public()` is a single line — `SetMetadata` and done,
A flag that tells the guard: "This route is free for everyone."

`@CurrentUser()` is `createParamDecorator`, light and lean,
It reaches into the request and pulls the user from the scene.
No middleware, no manual extraction, no `req.user` call —
Just slap the decorator on the parameter, that is all.

The `PokeAuthGuard` extends `AuthGuard('supabase')` with care,
Its `canActivate` checks the reflector — is the `IS_PUBLIC_KEY` there?
If yes, return true — the door swings wide and free,
If no, call `super.canActivate` — let Passport decree.

The `SupabaseStrategy` does the heavy JWT lift,
Extracting tokens from the bearer header, Swift.
Supabase URL and key and JWT secret, all configured,
A Passport strategy registered, the auth pipeline is figured.

## Canto XXIV: The Cron Jobs

Two cron jobs pulse like heartbeats through this application's veins,
Each one a different rhythm, serving different domains.
The first: `EVERY_5_MINUTES` in the `RemindersService` grand,
It scans for reminders matching the current time, on hand.

Normalized to the canonical form — February first, two-thousand-one —
Only hours and minutes matter when the matching's done.
Then timezone filtering ensures the day is right,
And matching reminders trigger messages — a scheduled light.

The second: `EVERY_MINUTE` in the `MessageService` beats,
A faster pulse that checks for messages with pending feats.
Active messages whose `nextSend` has arrived or passed are found,
And each is resent, tries incremented, next send time rebound.

Together they create the rhythm of accountability:
Every five minutes, new reminders check for sendability,
Every minute, pending messages check for their retry,
A two-layered system — no reminder left to die.

## Canto XXV: The Data Flow

From Supabase the user authenticates with JWT in hand,
Through `PokeAuthGuard` they pass, their identity now scanned.
The token's verified, the user object placed upon the request,
And `@CurrentUser()` extracts it — authenticated, blessed.

They call GET `/v1/users/onboard` — their profile is ensured,
Created if it's new, or returned if already stored.
Then POST `/v1/reminders` with their goal, their time, their days,
The system normalizes, assigns an emoji, and obeys.

The data lands in PostgreSQL through Prisma's typed embrace,
A Reminder row is born, occupying database space.
And every five minutes, the cron job's query sweeps the land,
Comparing normalized times — when a match is found, it's grand.

A Message row is born, the Twilio API is called,
An SMS flies through the air — the user is enthralled.
They text back the emoji, Twilio relays the POST,
The message is deleted — the poke acknowledged coast to coast.

Or they ignore it — and the retry cron kicks in at one-minute pace,
Re-sending the message, incrementing tries, a persistent chase.
Up to four attempts, each spaced by increasing hours of wait,
Then silence — the system stops, the user's left to contemplate.

## Canto XXVI: The Render Deployment

On Render.com, the backend lives and breathes and serves,
`poke-backend.onrender.com` — the production URL that swerves
Through DNS and load balancers to the running Node process,
Where `dist/main` is executed — the TypeScript, compiled, in dress.

`yarn prebuild` runs first: `rimraf dist` clears the old away,
Then `yarn prisma generate` ensures the client's up-to-date.
`nest build` compiles TypeScript down to JavaScript divine,
And `start:prod` runs the output — production down the line.

The PORT comes from the environment — Render sets its own,
And the app adapts, like water filling any vessel shown.
No hardcoded ports, no static paths — it's twelve-factor through and through,
Environment variables drive the config — that's the modern crew.

## Canto XXVII: The TwiML Response

When Twilio calls the `/v1/message/sms` endpoint's door,
The response must be XML — a format from the lore.
`@Header('Content-Type', 'text/xml')` adorns the route,
And `respondToMessage` builds TwiML — an XML-formatted shout.

`new this.twiml.MessagingResponse()` creates the frame,
`.message(pokeResponse)` inserts the text — the game.
`.toString()` renders it to XML that Twilio can read,
And the response flows back as structured text — a protocol agreed.

This is the only XML in the entire codebase found,
A single touchpoint with an older protocol's hallowed ground.
The rest is JSON, TypeScript, Prisma queries, modern fare,
But Twilio demands its TwiML, and Poke obliges there.

## Canto XXVIII: The Notification Time Trick

Let's dwell upon the cleverest trick within this codebase's art:
The `getNotificationTime` function, playing its part.
It takes a Date and flattens it: February first, two-thousand-one,
Preserving only hours and minutes — everything else is done.

Why this trick? Because reminders recur — they're not one-time events.
The date and month and year don't matter for recurring intents.
What matters is: "Send this at 8:00 AM" or "Send at noon."
So the time is stripped to its essence — a normalized commune.

By pinning every notification time to the same date and year,
Comparisons become trivial — just match the hour, my dear.
The cron job normalizes "now" the same way, then queries:
"Show me reminders where notificationTime equals this" — no worries.

It's elegant, it's simple, and it's slightly unconventional,
But it works with Prisma's DateTime queries — intentional.
A lesser codebase might store hours and minutes as integers apart,
But Poke uses a canonical Date — a developer's clever art.

## Canto XXIX: The Retry Escalation

The retry system deserves its stanza, mathematical and clean:
`getNextSendTime(new Date(), message.tries)` is the machine.
On the first try, one hour is added — a gentle interval of grace,
On the second try, two hours more — a longer breathing space.

The third try adds three hours to the current time's demand,
And the fourth try — if it fires — adds four hours, grand.
But `active` is set false when tries reach four, the final halt,
No more messages, no more pokes — the system finds no fault.

So the cadence is: immediate, then one hour, then two, then three,
An arithmetic escalation of accountability.
Not exponential, not aggressive — just a steady, growing nudge,
A system that respects the user's time without a grudge.

And each time, the `nextSend` is normalized through the canonical trick,
So the query in the resend cron matches clean and quick.
A beautiful interplay of utils, service, and cron,
That keeps the pokes arriving until the day is gone.

## Canto XXX: The Phone Number Dance

Phone numbers in Poke are stored without the plus sign's lead,
But Twilio sends them with a plus — a format we must heed.
So `receiveMessage` does a `req.body.From.replace('+', '')`,
Stripping the prefix before the database query starts to stir.

The `User.phone` field is unique — no two users share the same,
And this uniqueness is the key to the receive-message game.
When a text comes in, the phone identifies the soul,
And their reminders are loaded — each emoji playing its role.

`sendMessage` takes the phone directly from the user record,
And Twilio's API adds the plus back — a protocol accord.
The dance of plus and minus, of formatting and format,
Is a subtle detail handled by this backend, combat-ready, format-flat.

## Canto XXXI: The Logger's Watchful Eye

Throughout the code, the `Logger` keeps its faithful, watchful gaze,
Recording every action in its characteristic phrase.
`RemindersService.name` and `MessageService.name` — the context strings,
So every log line tells you exactly where the data sings.

"Creating reminder..." logs the time and days with care,
"Found N reminders to send" — the cron job's regular affair.
"Sending reminder to [emoji] [id]" — a line of pure intent,
"Message sending to [id], response from Twilio" — the message, sent.

"Received message from user: [body]" — the inbound text is logged,
"Responding with: [response]" — no detail left unclogged.
"Resending message [id] with tries [N]" — the retry's chronicled tale,
"Failed to delete messages for reminder [id]" — when cascades fail.

These logger lines are breadcrumbs through the forest of the code,
A debugging trail for when production hits a bumpy road.
They're not just noise — they're narrative, a story of each poke,
From creation through delivery to the emoji response spoke.

## Canto XXXII: The Reflections

And so we reach the closing cantos of this lengthy song,
A poem about a codebase — twenty-nine files strong.
It's not the largest project, nor the most complex you'll find,
But in its focused simplicity, there's beauty of a kind.

It solves a real problem: humans forget, they slack, they stray,
And sometimes all they need is a text to start their day.
A unicorn, a lion, or a watermelon slice,
A tiny digital nudge that says: "Hey, you — think twice."

The architecture's clean: NestJS with modules, services, and guards,
Prisma for the data, Twilio for sending cards.
Supabase for auth, Apple receipts for subscriptions' gate,
And cron jobs for the heartbeat — steady, never late.

## Canto XXXIII: The Ode to the Developer

To the developer who built this, line by line and test by test,
Who chose the emojis, designed the schema, gave it their best —
Who picked NestJS for structure, Fastify for speed,
Prisma for type safety, Twilio for the text-message deed —

Who wrestled with timezones (the bane of every coder's life),
Who normalized dates to 2001 to cut through temporal strife,
Who built a retry system with four tries and hourly gaps,
Who integrated Apple receipts and handled error traps —

This poem is for you. Your code tells a story clean and bright,
Of a product built with purpose on those January nights.
Twelve migrations in a month, a backend born from scratch,
A personal accountability system — a reminder to stay on track.

## Canto XXXIV: The Final Verse

So here it ends, this ballad of the Poke backend's domain,
A thousand lines of verse for a thousand lines of code's refrain.
From `main.ts` to `ping.sh`, from Prisma to TwiML,
From emojis to cron jobs — this codebase casts its spell.

May the unicorn keep prancing through the notification queue,
May the heart-eyes face remind you that your goals are overdue,
May the hamburger entice you to eat well (or hit the gym),
May the lion give you courage when the chances feel so slim.

And may this backend keep on running on its Render cloud so high,
Sending pokes to every user underneath the digital sky.
For Poke is more than code — it's a promise, it's a friend,
A gentle nudge that says: "Keep going. This is not the end."

*Fin.*
