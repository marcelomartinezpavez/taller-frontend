export const validarRut = (rut) => {
  if (!rut) return { valido: false, mensaje: "RUT es requerido" };
  
  const rutLimpio = rut.replace(/[.\s-]/g, "").toUpperCase();
  
  if (rutLimpio.length < 2) return { valido: false, mensaje: "RUT muy corto" };
  
  const rutSinDv = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);
  
  if (!/^\d+$/.test(rutSinDv)) return { valido: false, mensaje: "RUT inválido: debe contener solo números antes del dígito verificador" };
  
  if (!/^\d|K$/.test(dv)) return { valido: false, mensaje: "RUT inválido: dígito verificador debe ser 0-9 o K" };
  
  let suma = 0;
  let multiplicador = 2;
  
  for (let i = rutSinDv.length - 1; i >= 0; i--) {
    suma += parseInt(rutSinDv[i]) * multiplicador;
    multiplicador = multiplicador < 7 ? multiplicador + 1 : 2;
  }
  
  let dvCalculado = 11 - (suma % 11);
  if (dvCalculado === 11) dvCalculado = "0";
  if (dvCalculado === 10) dvCalculado = "K";
  
  if (dvCalculado.toString() === dv) {
    return { valido: true, mensaje: "" };
  }
  
  return { valido: false, mensaje: "RUT inválido: dígito verificador no coincide" };
};

export const formatearRut = (rut) => {
  if (!rut) return "";
  
  const rutLimpio = rut.replace(/[.\s-]/g, "").toUpperCase();
  const rutSinDv = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);
  
  if (!/^\d+$/.test(rutSinDv)) return rut;
  
  const rutFormateado = rutSinDv.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + dv;
  return rutFormateado;
};