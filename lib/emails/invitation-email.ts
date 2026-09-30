export interface InvitationEmailProps {
  parentName: string;
  childFirstName: string;
  code: string;
  activateUrl: string;
}

export function buildInvitationEmailHtml({
  parentName,
  childFirstName,
  code,
  activateUrl,
}: InvitationEmailProps): string {
  const escapedParentName = escapeHtml(parentName);
  const escapedChildFirstName = escapeHtml(childFirstName);
  const escapedCode = escapeHtml(code);
  const escapedActivateUrl = escapeHtml(activateUrl);

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invitación a OpenDayCare</title>
  </head>
  <body style="margin:0; padding:0; background-color:#FBF4EC; font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding:48px 16px;">
          <table role="presentation" width="100%" max-width="480" cellspacing="0" cellpadding="0" border="0" style="max-width:480px; background-color:#FFFFFF; border-radius:24px; border:1.5px solid #ECE0D0; overflow:hidden;">
            <tr>
              <td style="padding:36px 32px 28px; text-align:center;">
                <div style="font-size:22px; font-weight:700; color:#3F362E; margin-bottom:8px;">
                  ¡Hola, ${escapedParentName}!
                </div>
                <p style="font-size:15px; color:#94887B; line-height:1.55; margin:0 0 28px;">
                  Te invitaron a seguir el día de <strong style="color:#3F362E;">${escapedChildFirstName}</strong> en OpenDayCare.
                </p>

                <div style="background-color:#FBF1D6; border:1.5px dashed #E6D08A; border-radius:16px; padding:22px 20px; text-align:center; margin-bottom:28px;">
                  <div style="font-size:12px; font-weight:800; letter-spacing:0.7px; color:#A88526; margin-bottom:10px;">
                    CÓDIGO DE INVITACIÓN
                  </div>
                  <div style="font-family:Georgia,'Courier New',monospace; font-size:36px; font-weight:700; letter-spacing:6px; color:#8A7234; margin-bottom:8px;">
                    ${escapedCode}
                  </div>
                  <div style="font-size:13px; color:#A88526;">
                    Vence en 7 días
                  </div>
                </div>

                <a href="${escapedActivateUrl}" style="display:inline-block; padding:16px 28px; border-radius:14px; background:linear-gradient(180deg,#F4977E,#EE8164); color:#FFFFFF; font-size:15.5px; font-weight:800; text-decoration:none; box-shadow:0 10px 22px -8px rgba(238,129,100,0.55);">
                  Activar mi cuenta
                </a>

                <p style="font-size:13px; color:#A89A8B; margin:24px 0 0; line-height:1.5;">
                  Si el botón no funciona, copiá este link en tu navegador:<br />
                  <a href="${escapedActivateUrl}" style="color:#C5503A; word-break:break-all;">${escapedActivateUrl}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
