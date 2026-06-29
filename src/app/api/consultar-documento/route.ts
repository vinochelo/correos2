import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { robotUrl, ruc_proveedor, nombre_proveedor, factura_numero } = body;

    if (!robotUrl) {
      return NextResponse.json(
        { detail: "La URL del robot no está configurada." },
        { status: 400 }
      );
    }

    // Clean URL from trailing slashes
    const cleanRobotUrl = robotUrl.replace(/\/+$/, "");
    const targetUrl = `${cleanRobotUrl}/api/consultar-documento`;

    console.log(`[Proxy] Iniciando consulta al robot: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({
        ruc_proveedor,
        nombre_proveedor,
        factura_numero
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      let errDetail = `El robot respondió con código de error ${response.status}`;
      try {
        const parsed = JSON.parse(errText);
        errDetail = parsed.detail || parsed.message || errDetail;
      } catch (_) {}
      return NextResponse.json({ detail: errDetail }, { status: response.status });
    }

    const data = await response.json();
    console.log(`[Proxy] Respuesta exitosa del robot para ${ruc_proveedor}:`, data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Proxy] Error al conectar con el robot:", error);
    return NextResponse.json(
      { detail: `No se pudo conectar con el robot. Verifique el estado del túnel ngrok. Detalle: ${error.message}` },
      { status: 500 }
    );
  }
}
