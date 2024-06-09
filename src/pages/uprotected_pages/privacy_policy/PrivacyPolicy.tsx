import { ConstAppDetails } from '../../../constants/ConstContactDetails';

const PrivacyPolicy = () => {
  return (
    <div className="flex flex-col min-h-screen h-auto py-8 mx-4 sm:mx-24 lg:mx-20">
      <h1 className="text-4xl font-bold">Privacy Policy</h1>
      <p className="mt-5">
        Your privacy is important to us. It is our policy to respect your
        privacy regarding any information we may collect from you across our
        website and other sites we own and operate. This policy outlines the
        types of information we gather, how we use it, and the steps we take to
        ensure your data is protected.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Information We Collect</h2>
        <p className="mt-5">
          We only collect information about you if we have a reason to do so -
          for example, to provide our services, to communicate with you, or to
          make our services better. The types of information we collect include:
        </p>
        <ul className="list-disc list-inside mt-5">
          <li>
            Personal identification information (Name, email address, phone
            number, etc.)
          </li>
          <li>Demographic information (Age, gender, location, etc.)</li>
          <li>
            Technical data (IP address, browser type and version, time zone
            setting, browser plug-in types and versions, operating system and
            platform, etc.)
          </li>
          <li>
            Usage data (Information about how you use our website, products and
            services)
          </li>
          <li>
            Marketing and communications data (Your preferences in receiving
            marketing from us and your communication preferences)
          </li>
          <li>
            We are tracking live location data only during your shift and
            storing it in our database.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">How We Use Your Information</h2>
        <p className="mt-5">
          We use the information we collect for various purposes, including:
        </p>
        <ul className="list-disc list-inside mt-5">
          <li>To provide, operate, and maintain our website and services</li>
          <li>To improve, personalize, and expand our website and services</li>
          <li>
            To understand and analyze how you use our website and services
          </li>
          <li>
            To develop new products, services, features, and functionality
          </li>
          <li>
            To communicate with you, either directly or through one of our
            partners, including for customer service, to provide you with
            updates and other information relating to the website, and for
            marketing and promotional purposes
          </li>
          <li>To process your transactions and manage your orders</li>
          <li>To find and prevent fraud</li>
          <li>To comply with legal obligations and protect our rights</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Cookies</h2>
        <p className="mt-5">
          We use cookies and similar tracking technologies to track the activity
          on our website and hold certain information. Cookies are files with a
          small amount of data which may include an anonymous unique identifier.
          Cookies are sent to your browser from a website and stored on your
          device. Tracking technologies also used are beacons, tags, and scripts
          to collect and track information and to improve and analyze our
          service.
        </p>
        <p className="mt-5">
          You can instruct your browser to refuse all cookies or to indicate
          when a cookie is being sent. However, if you do not accept cookies,
          you may not be able to use some portions of our service. For more
          information on how we use cookies, please refer to our Cookie Policy.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Data Retention</h2>
        <p className="mt-5">
          We retain personal data only for as long as necessary to provide you
          with our services and for legitimate and essential business purposes,
          such as maintaining the performance of our services, making
          data-driven business decisions, complying with our legal obligations,
          and resolving disputes. The retention period may vary depending on the
          type of data and how it is used. For instance:
        </p>
        <ul className="list-disc list-inside mt-5">
          <li>
            We may retain your personal information for a longer period where
            necessary to comply with our legal obligations (such as for
            regulatory reporting, tax, accounting, and auditing obligations), or
            to protect our legal interests (such as in the event of a dispute or
            enforcement of our agreements).
          </li>
          <li>
            Usage data is generally retained for a shorter period of time,
            except when this data is used to strengthen the security or to
            improve the functionality of our service, or we are legally
            obligated to retain this data for longer periods.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Your Rights</h2>
        <p className="mt-5">
          You have certain rights regarding your personal data, including the
          right to access, rectify, or erase the personal data we hold about
          you. You also have the right to:
        </p>
        <ul className="list-disc list-inside mt-5">
          <li>Object to the processing of your data</li>
          <li>Request the restriction of processing your data</li>
          <li>Request the transfer of your data to another party</li>
          <li>
            Withdraw your consent at any time where we rely on your consent to
            process your personal data
          </li>
        </ul>
        <p className="mt-5">
          If you wish to exercise any of these rights, please contact us. We
          will respond to your request in accordance with applicable data
          protection laws.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Contact Us</h2>
        <p className="mt-5">
          If you have any questions about our privacy policy, please contact us
          at{' '}
          <a
            href={`mailto:${ConstAppDetails.APP_EMAIL}`}
            className="text-blue-400 underline"
          >
            {ConstAppDetails.APP_EMAIL}
          </a>
          . We are committed to resolving complaints about our collection or use
          of your personal data. If you have any questions, concerns, or
          complaints regarding this privacy policy or our data protection
          practices, please contact us at the email provided.
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
