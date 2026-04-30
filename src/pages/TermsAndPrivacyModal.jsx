import { X } from "lucide-react";
import "./TermsAndPrivacyModal.css";

export default function TermsAndPrivacyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Terms of Service & Privacy Policy</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {}
          <div className="policy-section">
            <h3 className="policy-title">Terms of Service</h3>

            <section>
              <h4>1. Acceptance of Terms</h4>
              <p>
                By accessing and using this website ("Nuestras Artesanías"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h4>2. Use License</h4>
              <p>
                Permission is granted to temporarily download one copy of the materials (information or software) on Nuestras Artesanías website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul>
                <li>Modifying or copying the materials</li>
                <li>Using the materials for any commercial purpose or for any public display</li>
                <li>Attempting to decompile or reverse engineer any software contained on the website</li>
                <li>Removing any copyright or other proprietary notations from the materials</li>
                <li>Transferring the materials to another person or "mirror" the materials on any other server</li>
              </ul>
            </section>

            <section>
              <h4>3. Product Information</h4>
              <p>
                All product descriptions, pricing, and availability information are subject to change without notice. We strive to provide accurate information but do not warrant that product descriptions, pricing, or other content of this website is accurate, complete, reliable, current, or error-free. While we make reasonable efforts to ensure the accuracy of our product information, occasional human errors may occur.
              </p>
            </section>

            <section>
              <h4>4. Pricing and Availability</h4>
              <p>
                We reserve the right to refuse any order and to limit or cancel quantities. Prices are subject to change without notice. All prices are in the currency specified on the website at the time of purchase.
              </p>
            </section>

            <section>
              <h4>5. Order Acceptance</h4>
              <p>
                We reserve the right to accept or refuse any order. We may, in our sole discretion, limit or cancel quantities purchased per person, per household or per order.
              </p>
            </section>

            <section>
              <h4>6. User Accounts</h4>
              <p>
                If you create an account on our website, you are responsible for maintaining the confidentiality of your account information and password. You agree to accept responsibility for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h4>7. Limitation of Liability</h4>
              <p>
                In no event shall Nuestras Artesanías or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Nuestras Artesanías website, even if we or an authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section>
              <h4>8. Disclaimer</h4>
              <p>
                The materials on Nuestras Artesanías website are provided on an "as is" basis. Nuestras Artesanías makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h4>9. Modifications</h4>
              <p>
                Nuestras Artesanías may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section>
              <h4>10. Contact Information</h4>
              <p>
                If you have any questions about these Terms of Service, please contact us through our website or by email at our contact address.
              </p>
            </section>
          </div>

          {}
          <div className="policy-section">
            <h3 className="policy-title">Privacy Policy</h3>

            <section>
              <h4>1. Introduction</h4>
              <p>
                Nuestras Artesanías ("we," "us," or "our") operates the website. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our website and the choices you have associated with that data.
              </p>
            </section>

            <section>
              <h4>2. Information Collection and Use</h4>
              <p>
                We collect several different types of information for various purposes to provide and improve our service to you:
              </p>
              <ul>
                <li><strong>Personal Data:</strong> Name, email address, phone number, address, payment information</li>
                <li><strong>Usage Data:</strong> Browser type, IP address, pages visited, time spent on pages, referring page</li>
                <li><strong>Cookies and Tracking Technology:</strong> We may use cookies to track activity on our website</li>
              </ul>
            </section>

            <section>
              <h4>3. Use of Data</h4>
              <p>
                Nuestras Artesanías uses the collected data for various purposes:
              </p>
              <ul>
                <li>To provide and maintain our service</li>
                <li>To notify you about changes to our service</li>
                <li>To allow you to participate in interactive features of our service</li>
                <li>To provide customer support</li>
                <li>To gather analysis or valuable information so we can improve our service</li>
                <li>To monitor the usage of our service</li>
                <li>To detect, prevent and address technical issues</li>
              </ul>
            </section>

            <section>
              <h4>4. Security of Data</h4>
              <p>
                The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
              </p>
            </section>

            <section>
              <h4>5. Links to Other Sites</h4>
              <p>
                Our website may contain links to other sites that are not operated by us. If you click on a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit. We have no control over and assume no responsibility for the content, privacy policies or practices of any third-party sites or services.
              </p>
            </section>

            <section>
              <h4>6. Children's Privacy</h4>
              <p>
                Our website is not addressed to anyone under the age of 18 ("Children"). We do not knowingly collect personally identifiable information from anyone under the age of 18. If you are a parent or guardian and you are aware that your child has provided us with Personal Data, please contact us immediately.
              </p>
            </section>

            <section>
              <h4>7. Changes to This Privacy Policy</h4>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "effective date" at the top of this Privacy Policy.
              </p>
            </section>

            <section>
              <h4>8. Contact Us</h4>
              <p>
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <ul>
                <li>By visiting this page on our website</li>
                <li>By email at our contact address</li>
                <li>By phone at our contact number</li>
              </ul>
            </section>

            <section>
              <h4>9. Your Rights</h4>
              <p>
                You have the right to:
              </p>
              <ul>
                <li>Access your personal data</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Request a copy of your personal data</li>
              </ul>
            </section>

            <section>
              <h4>10. Data Retention</h4>
              <p>
                Nuestras Artesanías will retain your Personal Data only for as long as necessary for the purposes set out in this Privacy Policy. We will retain and use your Personal Data to the extent necessary to comply with our legal obligations.
              </p>
            </section>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
