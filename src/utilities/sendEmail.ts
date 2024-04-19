import emailjs from 'emailjs-com'

interface sendEmailArgs {
  to_email: string
  to_name: string
  subject: string
  message: string
  from_name: string
}

export const sendEmail = async ({
  message,
  subject,
  to_email,
  to_name,
  from_name,
}: sendEmailArgs) => {
  const response = await emailjs.send(
    import.meta.env.VITE_EMAIL_JS_SERVICE_ID,
    import.meta.env.VITE_EMAIL_JS_TEMPLATE_ID,
    {
      to_email,
      to_name,
      from_name,
      subject,
      message,
    },
    import.meta.env.VITE_EMAIL_JS_USER_ID
  )
  return response
}
