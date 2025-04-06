import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Scale, 
  MessageSquare, 
  Crown,
  Check,
  Shield, 
  Gavel, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  Users,
  BookOpen,
  Star,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: MessageSquare,
    title: 'Chat Legal Inteligente',
    description: 'Obtén respuestas instantáneas a tus dudas legales con nuestro asistente de IA especializado.'
  },
  {
    icon: Shield,
    title: 'Asesoría Personalizada',
    description: 'Conecta con expertos legales para casos que requieran atención especializada.'
  },
  {
    icon: Gavel,
    title: 'Biblioteca de Leyes',
    description: 'Accede a una extensa colección de leyes y normativas de la República Dominicana.'
  }
];

const benefits = [
  {
    icon: Clock,
    title: 'Respuestas Inmediatas',
    description: 'No más esperas. Obtén respuestas a tus consultas legales en segundos.'
  },
  {
    icon: Users,
    title: 'Expertos Disponibles',
    description: 'Acceso a una red de abogados especializados cuando lo necesites.'
  },
  {
    icon: BookOpen,
    title: 'Información Actualizada',
    description: 'Base de datos legal constantemente actualizada con las últimas normativas.'
  },
  {
    icon: Star,
    title: 'Servicio Premium',
    description: 'Experiencia personalizada y soporte prioritario para todos los usuarios.'
  }
];

const faqs = [
  {
    question: '¿Cómo funciona el chat legal?',
    answer: 'Nuestro chat utiliza inteligencia artificial avanzada para proporcionar respuestas precisas a tus consultas legales, basándose en la legislación dominicana vigente.'
  },
  {
    question: '¿Es segura mi información?',
    answer: 'Sí, toda la información compartida en la plataforma está protegida con los más altos estándares de seguridad y encriptación.'
  },
  {
    question: '¿Puedo hablar con un abogado real?',
    answer: 'Sí, ofrecemos la opción de conectarte con abogados especializados para casos que requieran atención personalizada.'
  },
  {
    question: '¿Que hacemos con tus datos?',
    answer: 'Cuando te registras, nos das tu consentimiento para recopilar tu nombre, correo, dirección, datos de pago y tu historial de interacciones. Esa información se usa para gestionar tu cuenta, personalizar tu experiencia y ofrecerte un servicio seguro. Todo se maneja con protocolos de cifrado y se respeta la legislación de protección de datos vigente. Además, si en algún momento prefieres retirar tu consentimiento, tienes la opción de hacerlo fácilmente.'
  }
];

export function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Scale className="h-8 w-8 text-white" />
              <span className="ml-2 text-xl font-bold text-white">LegalAI RD</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/register">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Registrarse
                </Button>
              </Link>
              <Link to="/login">
                <Button className="bg-white text-neutral-900 hover:bg-neutral-100">
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 to-neutral-800 opacity-90" />
          <img
            src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80"
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8">
              Tu Asistente Legal<br />Inteligente
            </h1>
            <p className="text-xl md:text-2xl text-neutral-200 mb-12 max-w-3xl mx-auto">
              Obtén respuestas instantáneas a tus dudas legales con la ayuda de la inteligencia artificial más avanzada.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-white text-neutral-900 hover:bg-neutral-100">
                  Empezar Ahora <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="ghost" className="text-white border-2 border-white hover:bg-white/10">
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="text-xl text-neutral-600">
              Descubre las herramientas que te ayudarán a resolver tus dudas legales
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="group bg-neutral-50 rounded-xl p-8 hover:bg-neutral-900 transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-lg bg-neutral-200 group-hover:bg-white/10 flex items-center justify-center mb-6 transition-colors">
                  <feature.icon className="h-6 w-6 text-neutral-900 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 group-hover:text-white mb-4 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-neutral-600 group-hover:text-neutral-300 transition-colors">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Planes Simples y Transparentes
            </h2>
            <p className="text-xl text-neutral-600">
              Elige el plan que mejor se adapte a tus necesidades
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Plan Gratuito */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow"
            >
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">Plan Gratuito</h3>
              <p className="text-neutral-600 mb-6">Acceso básico a consultas legales</p>
              <div className="text-4xl font-bold text-neutral-900 mb-8">
                $0<span className="text-lg font-normal text-neutral-600">/mes</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-neutral-600">
                  <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  5 consultas diarias
                </li>
                <li className="flex items-center text-neutral-600">
                  <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  Acceso a leyes básicas
                </li>
                <li className="flex items-center text-neutral-600">
                  <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  Historial de consultas
                </li>
              </ul>
              <Link to="/register">
                <Button className="w-full bg-neutral-900 text-white hover:bg-neutral-800">
                  Empezar Gratis <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            {/* Plan Plus */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-neutral-900 text-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow relative overflow-hidden"
            >
              <div className="absolute top-4 right-4">
                <Crown className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Plan Plus</h3>
              <p className="text-neutral-300 mb-6">Acceso ilimitado y prioridad</p>
              <div className="text-4xl font-bold mb-8">
                $5<span className="text-lg font-normal text-neutral-300">/mes</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-neutral-300">
                  <Check className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
                  20 consultas diarias
                </li>
                <li className="flex items-center text-neutral-300">
                  <Check className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
                  Acceso a todas las leyes
                </li>
                <li className="flex items-center text-neutral-300">
                  <Check className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
                  Prioridad en asesorías
                </li>
              </ul>
              <Link to="/register">
                <Button className="w-full bg-white text-neutral-900 hover:bg-neutral-100">
                  Empezar Ahora <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">
              ¿Por qué elegir LegalAI RD?
            </h2>
            <p className="text-xl text-neutral-300">
              Descubre los beneficios de usar nuestra plataforma
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
                  <benefit.icon className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-neutral-300">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-24 bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-xl text-neutral-600">
              Encuentra respuestas a las dudas más comunes
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <span className="text-lg font-medium text-neutral-900">
                    {faq.question}
                  </span>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-neutral-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-neutral-500" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-neutral-600">{faq.answer}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 to-neutral-800 opacity-90" />
          <img
            src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80"
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-4xl font-bold text-white mb-8">
              Comienza a resolver tus dudas legales hoy mismo
            </h2>
            <p className="text-xl text-neutral-200 mb-8 max-w-2xl mx-auto">
              Únete a miles de usuarios que ya confían en LegalAI RD para sus consultas legales
            </p>
            <Link to="https://docs.google.com/document/d/1_HfFuCkuaQ_Sh7AwR5mZsyP4wBwuDZh0IhjjJaQK2Dc/edit?tab=t.0">
              <Button size="lg" className="bg-white text-neutral-900 hover:bg-neutral-100">
                Política de Privacidad y Condiciones de Uso
 <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center mb-8">
            <Scale className="h-8 w-8" />
            <span className="ml-2 text-xl font-bold">LegalAI RD</span>
          </div>
          <p className="text-center text-neutral-400">
            © {new Date().getFullYear()} LegalAI RD. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
