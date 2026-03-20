# `wcs-workshop-registration`

A Google Sheets application (yes, really...) for partially automating the process of handling workshop registrations.

## Functionality
- When someone registers, determine whether they get a spot or have to go on a waiting list.
- Immediately send an appropriate acknowledgement email to registrants, letting them know whether they got a spot and how to pay, or that they are on the waiting list.
- Automatically send email updates to the registrants when their status changes, e.g. payment is marked as received, or they've made it past the waiting list.
- Separate limits and role balancing for each level/pass as well as total limits and pass options without role (party passes). 

## Limitations
- No integration with payment reception -- a human has to go in and check a box when payment is received.
  - Payment notifications have been handled by a combination of asking registrants to send their Vipps transaction receipt by email and getting a list of payments from NTNUI Dance's finance officer.
- Partner registrations require manual processing.
- No update emails are sent about waiting list positions. A periodic update could be nice.
- The data format is tightly coupled to the specifics of recent workshops, and will likely have to be modified to be used for other cases.

## Setup
### Summary:
1. Create a Google Form to gather the necessary information about the people registering.
2. Create a Google Sheet connected to the Form.
3. Upload the code to Google Apps Script using [Google's `clasp` tool](https://developers.google.com/apps-script/guides/clasp).
4. Adapt the script and activate triggers in Google Apps Script.

### Description:
1. Create Google Form
    - The application expects certain information in the correct order to be collected.
    - See [`./templates/readme.md`](./templates/readme.md) for an example Google Form setup with the necessary questions and structure.

2. Create Google Sheet
    - The connected sheet can be created in the `Responses` tab of the form.
    - The application expects certain sheets to exist that have to be created.
    - See [`./templates/Example_Response_Sheet.xlsx`](./templates/Example_Response_Sheet.xlsx) for an example Google Sheet document.
    - The additionally necessary sheets (so, except the automatically created `Skjemasvar 1` or `Form responses 1`) can be copied from the example document.
    - Adapt the parameters in the `Parametre` sheet:
        - `maxImbalance`: a number defining maximum role ratio, e.g.: `1.5`
        - `maxParticipants`: a number defining maximum number of participants, e.g.: `80`
        - `maxParticipantsPerPass`: a comma-separated list with duples defining maximum number of participants for each pass, e.g.: `LEVEL_1, 25, LEVEL_2, 40, PARTY_1, 15, PARTY_2, 20`
        - `leaderBias`: a number defining  an offset for leaders taken into account (instructors, reservations), e.g.: `2`
        - `followerBias`: a number defining an offset for followers taken into account (instructors, reservations), e.g.: `2`
        - `noBalanceThreshold`: a number defining a minimum number of participants before a waiting list for role balancing is active, e.g.: `3`

3. Upload to Google Apps Script with `clasp`
    - The connected Apps Script project is created by choosing `Extensions->Apps Script` in the menu in the response sheet.
    - The initial files can be deleted.
    - Copy the script ID in the `Project Settings` and past it in [`./sheet-code/.clasp.json`](./sheet-code/.clasp.json).
    - Install [`clasp`](https://developers.google.com/apps-script/guides/clasp), login, and use `clasp push` to upload the code in `./sheet-code/`.

4. Adapt and activate in Google Apps Script
    - Add an `adminEmailAddress` in `constants.gs`. In certain situations the application will send an email notification about required manual interaction to this address.
    - Add an `replyEmailAddress` in `constants.gs`. Replies from receipents shall go to this address (may be the same as the sending address).
    - Set `emailEnabled` to `true` in `constants.gs` to enable sending of actual emails (otherwise, theoretically sent emails will only be visible in the run log of Apps Script for testing).
    - Check that the names for `SheetIds` in `dataAccess.gs` match the sheet names in the Google Sheet document. In particular the name for `ANSWERS` might vary since the automatically created sheet's name depends on the language settings.
    - Edit `computePrice()` in `serialization.gs` to set priceses for all passes and membership types.
    - Edit `vippsNumber`, `emailSender` and `emailTitle` in `templates.gs` to fit the event and host. Email body templates are host and style agnostic, but should be checked for conformity (e.g. payment instructions).
    - *Note: The adaptions above may also be done before uploading in the respective files in the repository `./sheet-code/*.ts`.*
    - Add and activate triggers in Apss Script under `Triggers`:
        - Add trigger for new responses: Choose `onNewRegistration` as function, `From Spreadsheet` as source and `On form submit` as event.
        - Add trigger for manual actions: Choose `installedEditHandler` as function, `From Spreadsheet` as source and `On edit` as event.
        - *Note: Activating the triggers will require to give permission for the script to access Gmail and send emails.*

## Architecture
The application is designed as a state machine.
When a new registration occurs, the data is read from the raw registration data sheet, certain fields are processed, and the processed data is written to an application internal sheet in the `NEW` state.

After this, the application evaluates the which state to move the new registrant to based on the criteria illustrated in the state diagram in figure 1.

![**Fig. 1:** State diagram.](./diagrams/state_diagram.png)

Since admitting a new registrant might mean that a person from the waiting list can also be admitted, the application then reevaluates all the existing registrations.
The application keeps reevaluating until the state stabilizes.
(This is not a particularly efficient approach, but seems to work well enough in practice for the amounts of registrations we usually get.)
