# Google Form Setup Example

Since Google Forms cannot be downloaded to provide an example, this document describes the most important setup details for a form using the current verison of the code.

The script is based on the **order of the questions** and **names of options** (like `Member`, or `Level 1`). Titles and descriptions may be changed.

Single membership options (`Member` or `Student`) or pass options (`Party 1` and/or `Party 2`) may be omitted in the form, without changes in the code. Parameters like limits and prices still need to be set but are unused (UNTESTED!!!).

## General Settings

- The form needs to **collect email addresses**, which is set in the settings (`responder input`)
- It should **not be allowed to edit responses** after being submitted
- When publishing, make sure the form is available for responses to everyone with the link (if the sign-up should not be limited within an organization)

## Questions in the Form

### Email
- *This is part of the first tile including title and form description*

### First Name
- **Type:** Short answer
- **Required:** Yes

### Last Name
- **Type:** Short answer
- **Required:** Yes

### Membership/Price Category
- **Type:** Multiple choice
- **Required:** Yes
- **Options:**
  - `Member`
  - `Student`
  - `Regular`

### Workshop Pass/Level
- **Type:** Multiple choice
- **Required:** Yes
- **Go to section based on answer:** Yes
  - *Go to section can be chosen, after they've been created*
- **Options:**
  - `Level 1`  (Go to section 2: Dance Role)
  - `Level 2`  (Go to section 2: Dance Role)
  - `Party 1`  (Go to section 3: Submit Registration)
  - `Party 2`  (Go to section 3: Submit Registration)

### \[SECTION\] Dance Role for Classes
- *Add new section*
- *Give information about role balance and partner sign-up*
- Example description:
  > We try to keep a balance between leaders and followers for the classes.<br>
  > In case of a significant imbalance of registrations you may be queued on the waiting list. You will get offered a spot as soon as there are enough registrations from the opposite role.<br>
  > Valid registrations with partner can skip the waiting list if there are enough spots left.

### Dance Role
- **Type:** Multiple choice
- **Required:** Yes
- **Options:**
  - `Leader`
  - `Follower`
  
### Dance Partner
- **Type:** Short answer
- **Required:** No

### \[SECTION\] Submit Registration
- *Add new section*
- *Give final information before submitting*
- Example information:
  > After submitting your form response with the button below, your registration will be processed.<br>
  > Based on available spots you will receive an email with payment information or a notification about being queued on the waiting list. If you signed up for classes and mentioned a dance partner, response times may increase due to manual confirmation.<br>
  > If you have questions regarding the workshop, registration or payment, don't hesitate to contact us via e-mail or Facebook.<br>
  > Registration is binding (no refund policy). However, if you are unable to attend the event after payment, you can contact us and we will try to transfer your pass to someone else. If you cancel due to health reasons, we will consider if we can afford to refund you after the event.<br>