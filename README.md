🛠️ Sistema de Gestión de Instalaciones Técnicas

Mini aplicación web desarrollada para la gestión y documentación de instalaciones técnicas.
Permite registrar trabajos realizados, controlar el acceso por roles y calcular automáticamente la facturación por técnico según metros instalados.

🚀 Descripción del Proyecto
Este sistema fue desarrollado como solución real para una empresa de instalaciones técnicas.

Permite:
Registrar instalaciones realizadas
Guardar información del cliente
Llevar historial organizado por fecha
Controlar acceso según tipo de usuario
Calcular automáticamente la liquidación de cada técnico
Filtrar resultados por período de fechas

El objetivo es facilitar la organización administrativa y el cálculo de pagos de forma automática y segura.

🧰 Tecnologías Utilizadas

HTML5
CSS3
JavaScript
Firebase Authentication
Firebase Firestore

🔐 Sistema de Autenticación y Roles
La aplicación utiliza Firebase Authentication para controlar el acceso.

👤 Acceso restringido
Solo pueden ingresar usuarios habilitados desde Firebase.

🔒 Control por roles
El sistema valida el correo electrónico del usuario y determina qué secciones puede visualizar.

• El administrador puede acceder a todos los módulos.
• Los técnicos solo pueden acceder al registro de instalaciones.
• Si un usuario intenta ingresar a una sección no autorizada, el sistema bloquea el acceso automáticamente.

Esto simula el funcionamiento real de una empresa donde el dueño tiene acceso total y los empleados tienen permisos limitados.

📝 Registro de Instalaciones

Cada instalación almacena:

• Técnico responsable
• Fecha
• Calle / ubicación
• Número de cliente
• Metros instalados
• Observaciones

Toda la información se guarda en Firebase Firestore.

💰 Módulo de Facturación
El sistema calcula automáticamente cuánto debe cobrar cada técnico según la cantidad de metros instalados.

🔹 Funcionamiento

1- El sistema clasifica las instalaciones según rangos de metros:

0 – 50 metros

50 – 100 metros

100 – 150 metros, etc

2- Cada rango tiene un valor económico asignado.

3- Se agrupan las instalaciones por:
• Técnico
• Rango de metros
• Período de fechas seleccionado

4- El sistema:
• Cuenta cuántas instalaciones realizó el técnico en cada rango
• Multiplica la cantidad por el valor correspondiente
• Suma los resultados
• Muestra el total final a cobrar

El cálculo es dinámico y se realiza con JavaScript utilizando datos almacenados en Firebase.

📅 Filtros por Fecha

El módulo de facturación permite seleccionar:
• Fecha desde
• Fecha hasta

El sistema calcula automáticamente el total correspondiente al período seleccionado.

🧠 Lógica Implementada

Este proyecto incluye:

• Condicionales
• Funciones personalizadas
• Manipulación de arrays
• Filtrado de datos por fecha
• Agrupación de información
• Cálculo matemático dinámico
• Control de acceso por roles
• Estructuración de lógica de negocio

🎯 Objetivo del Proyecto

Aplicar conocimientos de desarrollo frontend y Firebase en un caso real, resolviendo una necesidad concreta de organización administrativa y cálculo de pagos.

📌 Estado del Proyecto

Proyecto funcional y en uso.

Posibles mejoras futuras:

• Panel de administración avanzado
• Exportación a Excel
• Estadísticas visuales
• Mejora de diseño responsive

📸 Capturas del Sistema

💰 Facturación
<img width="1349" height="606" alt="Facturacion png" src="https://github.com/user-attachments/assets/6ff190b4-9c8a-477f-bb5f-aad23ce9ab8a" />

📝 Registro
<img width="1345" height="600" alt="Registro png" src="https://github.com/user-attachments/assets/1db1cfb2-5de9-491b-9788-e120d3fdc412" />

🔐 Login
<img width="1356" height="596" alt="Login png" src="https://github.com/user-attachments/assets/75fc2c2c-8b43-4c0b-8866-1daab7ec022c" />

👩‍💻 Autora

Brisa Argañaraz
Frontend Developer Junior
