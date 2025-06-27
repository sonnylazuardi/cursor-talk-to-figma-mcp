# Change Control Video Script
*Total duration: 3:47*

## Introduction (0:00 - 0:15)
Hello everyone! I'm Jude, and today I'll walk you through the new Change Control interface we've developed. This tool centralizes GitLab Merge Request management from submission to approval in one simple interface. Let's explore it together!

## Main Interface Overview (0:15 - 0:40)
As you can see, we've updated the group and service lists to use a breadcrumb navigation style. For services, we've implemented what we discussed in our team meetings - checking if you have access permissions for each service. Those with access will show a "Grant" label in the dropdown, and these authorized services appear at the top of the list for easier access.

## Window Management (0:40 - 1:00)
In the top right corner, we've added a window view panel management feature similar to what you're already familiar with in VS Code or Cursor. This lets you collapse or expand the left and right panels with one click.

## Right Panel & AI Integration (1:00 - 1:20)
For the right panel, we're considering an initial idea. Since engineers already recognize this area as a "solution-finding zone" in VS Code and Cursor, we're thinking about integrating Chrome's built-in AI or grabGPT to provide solutions here. This isn't a high priority feature yet, but we'd like your thoughts.

## Settings Interface (1:20 - 1:40)
When you click the settings button, you'll see a UI form for modifying service information. We're suggesting this form-based approach because currently, you need to edit multiple files individually, which is cumbersome and inefficient since each file manages very little information. Since UCM engineers approve and manage this list, we believe a form interface won't cause management or scalability issues.

## File Browser & Editor (1:40 - 2:05)
Going back to the finder, you can see the first file in the root is selected, and detailed environment settings appear on the right. The most important aspect is this editor experience. Some users we interviewed mentioned they create config values locally and only use UCM for preview and validation checks.

## Monaco Editor Integration (2:05 - 2:25)
That's why we're providing a powerful new editor form that validates and displays errors in real-time on the web. We're proposing to implement Microsoft's open-source Monaco Editor, which offers instant validation, minimaps, and various customization options that perfectly align with our needs.

## Environment Management (2:25 - 2:45)
Looking at the screen again, you can add or manage environments in the top or bottom right. You can expand or collapse environments to change detailed settings. Once changes are made, the submit button at the bottom becomes active.

## Submission Process (2:45 - 3:00)
Clicking submit opens a change request dialog for final review. After sending the request, the detail page shows a pending status, and the submit button becomes inactive.

## File Creation (3:00 - 3:15)
Creating a new file works similarly. Like in VS Code, select the folder where you want to create a file and click the file creation button. The dialog already has the selected base path filled in - just complete the path and click create to see a new file window with a basic template.

## Change Control Menu (3:15 - 3:35)
If you encounter errors, you can visit GitLab directly or use the Change Control menu to track all your requests at a glance. You can also easily view, check, and approve or reject incoming requests.

## Additional Features & Conclusion (3:35 - 3:47)
Finally, the side menu lets you toggle dark mode with one click or open the UCM Slack channel. Thank you for watching this overview of our new Change Control interface. We look forward to your feedback! 