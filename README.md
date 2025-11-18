# Poke

Poke is a personal accountability system. You setup recurring goals on the platform and get reminded about them via text message. For example, if you want to go to the gym three days a week, you can add a reminder in Poke to message you on your gym days. Poke will keep track of when you accomplish your goals or when you've slipped up.

## MVP

- User can create reminders that will be regularly sent as text
- User can set which days reminders are sent
- User can set which times reminders are sent
- User can respond to text to confirm completion
- User can response to text to disable reminders (”snooze”)
- User gets reminded if they do not respond to text
- User can manage their reminders

## Stretch

- User can see dashboard summarizing their reminders
- User can see data visualization of their streaks

## Math Behind Poke

### Success Rate Calculation

The success rate for a given reminder is calculated as:

```
Success Rate = (Completed Tasks / Total Tasks) × 100%
```

### Streak Calculation

A streak represents consecutive successful completions:

```
Streak Length = n, where n is the number of consecutive completions
```

The probability of maintaining a streak of length n with success rate p:

```
P(Streak ≥ n) = p^n
```

### Expected Value of Weekly Goals

For a goal requiring k completions per week with n opportunities:

```
E(X) = n × p

Where:
- E(X) is the expected number of completions
- n is the number of scheduled reminders
- p is the historical success rate
```

### Optimal Reminder Frequency

Using the forgetting curve, the optimal reminder interval follows:

```
R = e^(-t/S)

Where:
- R is retention
- t is time
- S is the strength of memory (affected by previous completions)
```