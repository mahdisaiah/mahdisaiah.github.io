<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Collect form data
    $name = htmlspecialchars($_POST['name']);
    $email = htmlspecialchars($_POST['email']);
    $message = htmlspecialchars($_POST['message']);

    // Set the recipient email address
    $to = "mahdisaiahparis@gmail.com";

    // Set the email subject
    $subject = "New Contact Form Submission from $name";

    // Build the email content
    $email_content = "Name: $name\n";
    $email_content .= "Email: $email\n\n";
    $email_content .= "Message:\n$message\n";

    // Set the email headers
    $headers = "From: $name <$email>";

    // Send the email
    if (mail($to, $subject, $email_content, $headers)) {
        // Email sent successfully
        echo "<p>Thank you for contacting me, $name. I will get back to you soon!</p>";
    } else {
        // Email failed to send
        echo "<p>Sorry, there was an error sending your message. Please try again later.</p>";
    }
} else {
    // Not a POST request, redirect to the form page
    header("Location: index.html");
    exit;
}
?>