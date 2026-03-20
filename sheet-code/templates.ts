function sendEmail(
  recipient: string,
  title: string,
  body: string,
  options: GoogleAppsScript.Gmail.GmailAdvancedOptions = {}
) {
  if (emailEnabled) {
    Logger.log(`Sending email
${recipient}
${title}
${body}`)
    GmailApp.sendEmail(recipient, title, body, {
      name: emailSender,
      replyTo: replyEmailAddress,
      ...options
    })
  } else {
    Logger.log(`Email disabled. Would have sent this:
${recipient}
${title}
${body}`)
  }
}


/** Vipps number (and channel) */
const vippsNumber = "129012 (NTNUI Dans) -> Workshop WCS"


/** Email sender name */
const emailSender = "NTNUI Dans WCS"


/** Subject line for emails */
const emailTitle = (type: string) => `NTNUI Dans WCS Workshop Registration - ${type}`


/**  Body text for waiting list */
const waitingListBody = (name: string) => `Hi ${name} and thank you for signing up for our workshop!

To ensure balance between roles in the classes and not exceed the room capacities, we have had to put in place a waiting list. Unfortunately, you have been put on this waiting list.

We will send you a new email once enough people of the opposite role have signed up or a spot in the classes has been freed that you are taken off the waiting list. Alternatively, you can get someone of the opposite role to write your name in the partner field when signing up. You will then immediately move past the waiting list if the room capacity has not been reached yet.
${emailClosure}`


/** Body text for payment info */
const paymentInfoBody = (name: string, price: number, role: Role) => `Hi ${name} and thank you for signing up for our workshop!

We're pleased to inform you, that you have received a ${role.toLowerCase()} spot at the workshop.
${paymentInfo(price)}
${emailClosure}`


/** Body text for payment info after waiting list */
const paymentInfoAfterWaitingBody = (name: string, price: number, role: Role) => `Hi again ${name}!

We're pleased to inform you, that you are no longer on the waiting list and have received a ${role.toLowerCase()} spot at the workshop.
${paymentInfo(price)}
${emailClosure}`


/** Body text for partner signup */
const partnerSignupBody = (name: string) => `Hi ${name} and thank you for signing up for our workshop!

There is a waiting list, but since you signed up with a partner, you will skip the waiting list as soon as we have confirmed your partner's registration.

Please note that it is necessary that your partner registers as well, otherwise we cannot complete your registration.
${emailClosure}`


/** Body text for payment info after partner signup */
const paymentInfoAfterPartnerBody = (name: string, price: number, role: Role) => `Hi again ${name}!

We're pleased to inform you, that your dance partner has signed up and you have received a ${role.toLowerCase()} spot at the workshop.
${paymentInfo(price)}
${emailClosure}`


/** Body text for payment confirmation */
const paymentConfirmationBody = (name: string) => `Hi again ${name}!

We have confirmed your payment, and your registration is now complete. We look forward to seeing you!
${emailClosure}`


/** Body text for cancellation */
const cancellationBody = (name: string) => `Hi ${name}!

We have processed your cancellation, and your registration is now cancelled. We hope to see you at another event in the future!
${emailClosure}`


/** Payment info */
const paymentInfo = (price: number) => `
To secure your spot, please complete your registration by making the payment within 48 hours after receiving this email. Otherwise, we may offer your spot to the next person on the waiting list.

We prefer payment by Vipps. If you don't have the option to pay by Vipps, contact us and we can arrange payment by card or cash during the workshop.

Vipps: ${vippsNumber}

Price: ${price} NOK

After paying, please reply to this email with a screenshot of the Vipps receipt. If screenshots don't work in Vipps, this receipt can also be exported with the "Share" button (upper right corner).`


/** Email closure */
const emailClosure = `
Best regards,
${emailSender}`