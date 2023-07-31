#!/usr/bin/env node

import * as cron from 'node-cron';
import { spawn } from 'child_process';
import * as notifier from 'node-notifier';

// Days of the week (Mon to Sun)
const daysOfWeek = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// Function to run the `index.js` script with the specified --day argument
function runFindCampsite(day: string) {
  const child = spawn('node', ['index.js', '--campground', '498', '--api', 'reserve_ca', '--nights', '1', '--day', day]);

  let output = ''; // Store the output of the script

  // Capture the script's output
  child.stdout.on('data', (data) => {
    output += data.toString();
  });

  child.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);
    console.log(output)

    // Check for "Found X matching itinerary" pattern
    const match = output.match(/Found (\d+) matching itinerary/);
    if (match) {
      const foundItineraryCount = parseInt(match[1], 10);
      if (foundItineraryCount > 0) {
        // Extract all the matching itineraries from the output
        const itineraryMatches = output.match(/- \d+\/\d+\/\d+ to \d+\/\d+\/\d+ \(in .+?\):\n(.*\n.*)/g);
        if (itineraryMatches) {
          let notificationMessage = `Found ${foundItineraryCount} matching itinerary on ${day.toUpperCase()}:\n\n`;
          for (const itinerary of itineraryMatches) {
            notificationMessage += `${itinerary}\n\n`;
          }

          // Trigger a notification with the aggregated message for all matching itineraries
          notifier.notify({
            title: 'Campsite Finder',
            message: notificationMessage,
            sound: true,
          });
        }
      }
    }
  });
}

// Run `runFindCampsite` immediately after the first invocation
daysOfWeek.forEach((day) => {
    console.log(`Running task for day: ${day}`);
    runFindCampsite(day);
  });

console.log(`Scheduled to run every 1hrs.`);
// Schedule tasks for each day of the week every two hours
for (const day of daysOfWeek) {  
  const cronExpression = `0 */1 * * *`;
  
  cron.schedule(cronExpression, () => {
    console.log(`Running task for day: ${day}`);
    runFindCampsite(day);
  });
}