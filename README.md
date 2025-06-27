# Busy Bees

Serverless app for finding free timeslot for your group.
It allows syncing calendars from different providers (Google, Apple, Microsoft Outlook...)
It is implemented using a scalable tech stack using SST v3 framework, designed to be deployed in the Cloud on AWS.

**The problem it solves:**
Imagine you are assigned to a group project at Uni with a few people, now you need to find a time for a group meeting.
Using this tool all of you can see the schedules of the other persons visually, while preserving users privacy (not showing the details of the events) so you can find a perfect time for your meeting.
It automatically shows times where everybody is available.

_The app is being developed as a project for the Scalability Engineering module at Technische Universität Berlin_

## Features

### App Features

- Allows finding common free timeslot in big groups
- Free time slot finding between different calendar platforms (Google, Apple, Microsoft)
- Google Calendar support (planned)
- Microsoft Outlook support (planned)
- Apple Calendar support (through .ics urls)
- .ics files (planned)
- .ics urls (planned)

## Deployment

The project uses the SST v3 framework which allows easy deployment in the AWS cloud.

In order to deploy the project run:

```bash
npm install
npx sst deploy
```

## Development

For development SST framework allows easy development deployment.
Configure your aws cli first with your account and then run:

```bash
npx sst dev
```
