import { useState, useEffect } from 'react';
import { ChevronDown, Menu, X, Phone, Mail, MapPin, ArrowRight, Check, Factory, Settings, Palette, TrendingUp, Sparkles, Clock, Shield, Award, User, MessageCircle } from 'lucide-react';

// Product data
const products = [
  {
    id: 'h100',
    model: 'H100',
    name: '曳引钢丝绳家用电梯',
    features: ['经典稳定', '成熟技术', '低噪音运行'],
    category: '曳引电梯',
    description: '采用成熟曳引技术，钢丝绳传动，运行平稳可靠，是家庭安装的理想选择。'
  },
  {
    id: 'h200pro',
    model: 'H200PRO',
    name: '强驱观光家用电梯',
    features: ['视野通透', '强驱动力', '观光设计'],
    category: '观光电梯',
    description: '强驱驱动系统配合观光玻璃设计，让空间更加通透开阔，彰显品味。'
  },
  {
    id: 'h300',
    model: 'H300',
    name: '曳引钢带家用电梯',
    features: ['静音科技', '高效节能', '现代设计'],
    category: '曳引电梯',
    description: '钢带传动技术，静音效果出众，节能环保，为现代家庭而生。'
  },
  {
    id: 'h400mini',
    model: 'H400MINI',
    name: '无轿厢平台电梯',
    features: ['空间利用率高', '极简设计', '安装灵活'],
    category: '平台电梯',
    description: '无轿厢设计，最大化空间利用率，特别适合空间受限的安装场景。'
  },
  {
    id: 'h400pro',
    model: 'H400PRO+',
    name: '自动门轿厢平台电梯',
    features: ['自动门配置', '便捷出入', '高端配置'],
    category: '平台电梯',
    description: '配备自动门系统，出入更加便捷舒适，提升用户体验。'
  },
  {
    id: 'h500',
    model: 'H500',
    name: '小尺寸龙门架曳引电梯',
    features: ['小尺寸设计', '龙门架结构', '节省空间'],
    category: '曳引电梯',
    description: '专为小空间设计的龙门架结构，曳引驱动，完美适应各种户型。'
  },
  {
    id: 'h600',
    model: 'H600',
    name: '螺杆观光梯',
    features: ['螺杆驱动', '观光设计', '安全可靠'],
    category: '观光电梯',
    description: '螺杆驱动系统配合观光设计，安全性高，视野开阔。'
  },
  {
    id: 'h700',
    model: 'H700',
    name: '层悦系列观光电梯',
    features: ['高端系列', '层悦体验', '豪华配置'],
    category: '观光电梯',
    description: '华丰高端系列电梯，层悦体验，豪华配置，品质之选。'
  }
];

// Navigation component
function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: '首页', href: '#home' },
    { name: '关于华丰', href: '#about' },
    { name: '制造实力', href: '#manufacturing' },
    { name: '专属定制', href: '#customization' },
    { name: '产品中心', href: '#products' },
    { name: '联系我们', href: '#contact' }
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'glass-nav shadow-lg' : 'bg-transparent'}`}>
      <div className="container-custom">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-3">
            <img src="/huafeng-logo.png" alt="华丰电梯" className="h-12 w-auto" />
            <div>
              <span className={`text-xl font-bold ${isScrolled ? 'text-primary' : 'text-white'}`}>华丰电梯</span>
              <p className={`text-xs ${isScrolled ? 'text-gray-500' : 'text-white/70'}`}>智能制造工厂</p>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`font-medium hover:text-gold transition-colors ${isScrolled ? 'text-gray-700' : 'text-white'}`}
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden lg:block">
            <a href="#contact" className="btn-accent">
              立即咨询
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t py-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block py-3 px-4 text-gray-700 hover:text-gold hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <div className="px-4 pt-4">
              <a href="#contact" className="btn-accent block text-center">
                立即咨询
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// Hero Section
function HeroSection() {
  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-dark-light to-primary">
        {/* Pattern overlay */}
        <div className="absolute inset-0 pattern-grid opacity-30"></div>
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gold/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gold/10 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container-custom pt-32 pb-20">
        <div className="max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8 animate-slide-up">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-white/90 text-sm">10年深耕 行业领航</span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 animate-slide-up animation-delay-100">
            十年坚持智造质量
            <span className="block text-gradient-gold mt-2">整梯OEM/ODM领航者</span>
          </h1>

          {/* Description */}
          <p className="text-xl lg:text-2xl text-white/80 mb-10 max-w-2xl animate-slide-up animation-delay-200">
            我们不仅能提供全场景定制与专属开发，更能助您建立坚实的成本优势，让您的品牌在激烈竞争中脱颖而出！
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 animate-slide-up animation-delay-300">
            <a href="#products" className="btn-accent text-lg">
              查看产品系列
              <ArrowRight className="inline-block ml-2 w-5 h-5" />
            </a>
            <a href="#manufacturing" className="btn-outline border-white text-white hover:bg-white hover:text-primary">
              了解制造实力
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t border-white/20 animate-slide-up animation-delay-400">
            <div>
              <div className="text-4xl lg:text-5xl font-bold text-gold">10+</div>
              <div className="text-white/70 mt-2">行业经验</div>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-bold text-gold">2</div>
              <div className="text-white/70 mt-2">大规模工厂</div>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-bold text-gold">8+</div>
              <div className="text-white/70 mt-2">产品系列</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-8 h-8 text-white/50" />
      </div>
    </section>
  );
}

// About Section
function AboutSection() {
  return (
    <section id="about" className="section-padding bg-white pattern-dots">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 text-gold font-medium mb-4">
              <Award className="w-5 h-5" />
              <span>关于华丰</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-primary mb-6">
              10年深耕<br />
              <span className="text-gold">匠心筑梦</span>
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              华丰十年坚持，深耕不辍，如今已成长为整梯OEM、ODM的领航者。我们拥有苏州、无锡两大规模化工厂，实现了从结构设计、开模、CNC加工到表面处理的全工艺链自主制造。
            </p>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              全套瓦格纳喷涂设备的加持，让我们专注于产品表面工艺处理解决方案，天花板级产品质感已成常态。我们真正从源头入手，减少中间环节损耗，为客户建立坚实的成本优势。
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary">10年经验</h4>
                  <p className="text-sm text-gray-500">深厚行业积累</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Factory className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary">专业工厂</h4>
                  <p className="text-sm text-gray-500">规模化生产</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Settings className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary">全场景定制</h4>
                  <p className="text-sm text-gray-500">满足多元需求</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Palette className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary">专属开发</h4>
                  <p className="text-sm text-gray-500">打造独特产品</p>
                </div>
              </div>
            </div>
          </div>

          {/* Image Grid */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl h-64 flex items-center justify-center overflow-hidden">
                  <div className="text-center p-6">
                    <Factory className="w-16 h-16 text-gold mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">苏州工厂</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-primary to-dark-light rounded-2xl h-48 flex items-center justify-center overflow-hidden">
                  <div className="text-center p-6">
                    <Settings className="w-12 h-12 text-gold mx-auto mb-3" />
                    <p className="text-white font-medium">CNC加工中心</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="bg-gradient-to-br from-primary to-dark-light rounded-2xl h-48 flex items-center justify-center overflow-hidden">
                  <div className="text-center p-6">
                    <Sparkles className="w-12 h-12 text-gold mx-auto mb-3" />
                    <p className="text-white font-medium">瓦格纳喷涂</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl h-64 flex items-center justify-center overflow-hidden">
                  <div className="text-center p-6">
                    <Shield className="w-16 h-16 text-gold mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">无锡工厂</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-2xl p-6 animate-float">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">成本优势</p>
                  <p className="text-sm text-gray-500">源头直供</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Manufacturing Section
function ManufacturingSection() {
  const processes = [
    { step: '01', title: '结构设计', description: '专业团队定制化产品结构设计' },
    { step: '02', title: '开模制造', description: '高精度模具开发与制造' },
    { step: '03', title: 'CNC加工', description: '精密数控加工中心' },
    { step: '04', title: '表面处理', description: '多工艺表面处理解决方案' },
    { step: '05', title: '瓦格纳喷涂', description: '全套设备专业喷涂' }
  ];

  return (
    <section id="manufacturing" className="section-padding bg-primary pattern-grid">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-gold font-medium mb-4">
            <Factory className="w-5 h-5" />
            <span>制造实力</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            全工艺链<span className="text-gold">自主制造</span>
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            苏州、无锡两大规模化工厂，铝合金产品从结构设计、开模到CNC加工、表面处理，全部自主制造
          </p>
        </div>

        {/* Process Flow */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold/50 to-transparent -translate-y-1/2"></div>

          <div className="grid lg:grid-cols-5 gap-8">
            {processes.map((process, index) => (
              <div key={process.step} className="relative">
                {/* Step Card */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all duration-300 group">
                  {/* Step Number */}
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gold to-gold-dark rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-bold text-white font-['Montserrat']">{process.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{process.title}</h3>
                  <p className="text-white/60 text-sm">{process.description}</p>
                </div>

                {/* Arrow Connector */}
                {index < processes.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-gold" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="w-14 h-14 bg-gold/20 rounded-xl flex items-center justify-center mb-6">
              <Settings className="w-7 h-7 text-gold" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">全套瓦格纳喷涂设备</h3>
            <p className="text-white/60">
              专业喷涂设备加持，专注产品表面工艺处理解决方案，天花板级产品质感已成常态
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="w-14 h-14 bg-gold/20 rounded-xl flex items-center justify-center mb-6">
              <TrendingUp className="w-7 h-7 text-gold" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">源头入手减少中间环节</h3>
            <p className="text-white/60">
              真正从源头制造入手，减少中间环节损耗，全面降低客户成本
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="w-14 h-14 bg-gold/20 rounded-xl flex items-center justify-center mb-6">
              <Shield className="w-7 h-7 text-gold" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">铝合金全工艺链</h3>
            <p className="text-white/60">
              铝合金产品从结构设计、开模到CNC加工、表面处理，全部自主制造
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// Customization Section
function CustomizationSection() {
  return (
    <section id="customization" className="section-padding bg-gray-50">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-gold font-medium mb-4">
            <Palette className="w-5 h-5" />
            <span>专属定制</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-primary mb-6">
            释放<span className="text-gold">设计</span>与<span className="text-gold">效率</span>潜能
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            为品牌量身打造独有的产品结构与设计，让你的产品自带辨识度
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left - Custom Development */}
          <div className="bg-white rounded-3xl p-10 shadow-xl card-hover-gold">
            <div className="w-16 h-16 bg-gradient-to-br from-gold to-gold-dark rounded-2xl flex items-center justify-center mb-8">
              <Palette className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-primary mb-4">专属产品开发</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              为品牌量身打造独有的产品结构与设计，让你的产品自带辨识度。通过高效的工艺流程和设备利用率，实现高定制化的同时进行成本控制。
            </p>
            <ul className="space-y-4">
              {[
                '独有的产品结构设计',
                '品牌专属外观定制',
                '个性化色彩搭配',
                '独特纹理质感处理'
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-gold" />
                  </div>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right - Cost Advantage */}
          <div className="bg-white rounded-3xl p-10 shadow-xl card-hover-gold">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-dark-light rounded-2xl flex items-center justify-center mb-8">
              <TrendingUp className="w-8 h-8 text-gold" />
            </div>
            <h3 className="text-2xl font-bold text-primary mb-4">成本优势</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              特殊的色彩搭配、纹理质感，都能以更优的价格满足个性化的需求。真正的源头制造，让您在激烈竞争中拥有价格优势。
            </p>
            <ul className="space-y-4">
              {[
                '真正的源头工厂价格',
                '高效的工艺流程',
                '高设备利用率',
                '灵活的定制方案'
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="mt-16 bg-gradient-to-r from-primary to-dark-light rounded-3xl p-10 lg:p-16 text-center">
          <h3 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            让您的品牌在激烈竞争中脱颖而出
          </h3>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            10年经验是我们的底气，专业工厂是我们的保障，全场景定制能力是我们的基础，专属产品开发定制是我们的利器，成本优势是我们服务的根本核心
          </p>
        </div>
      </div>
    </section>
  );
}

// Products Section
function ProductsSection() {
  const categories = ['全部', '曳引电梯', '观光电梯', '平台电梯'];
  const [activeCategory, setActiveCategory] = useState('全部');

  const filteredProducts = activeCategory === '全部'
    ? products
    : products.filter(p => p.category === activeCategory);

  return (
    <section id="products" className="section-padding bg-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-gold font-medium mb-4">
            <Settings className="w-5 h-5" />
            <span>产品中心</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-primary mb-6">
            全场景<span className="text-gold">定制</span>产品
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            涵盖曳引电梯、观光电梯、平台电梯等多种类型，满足不同场景需求
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeCategory === category
                  ? 'bg-gold text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gold/10 hover:text-gold'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden card-hover group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Product Image Placeholder */}
              <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-gold/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-center z-10">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-dark-light rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-bold text-gold font-['Montserrat']">{product.model}</span>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6">
                <div className="text-xs text-gold font-medium mb-2">{product.category}</div>
                <h3 className="text-lg font-bold text-primary mb-2">{product.name}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{product.description}</p>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 text-gold font-medium hover:gap-3 transition-all"
                >
                  了解更多
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Contact Section
function ContactSection() {
  return (
    <section id="contact" className="section-padding bg-primary pattern-grid">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left - Info */}
          <div>
            <div className="inline-flex items-center gap-2 text-gold font-medium mb-4">
              <Phone className="w-5 h-5" />
              <span>联系我们</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              开启您的<span className="text-gold">合作之旅</span>
            </h2>
            <p className="text-xl text-white/70 mb-10">
              无论是OEM/ODM合作，还是产品定制需求，我们都将为您提供专业的解决方案
            </p>

            {/* Contact Info Cards */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">工厂地址</h4>
                  <p className="text-white/60">苏州市高新区华桥路168号</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">联系人</h4>
                  <p className="text-white/60">吴先生</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">联系电话</h4>
                  <p className="text-white/60">18362618220</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">微信二维码</h4>
                  <p className="text-white/60">扫码添加微信</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Form & WeChat QR */}
          <div className="space-y-8">
            {/* Contact Form */}
            <div className="bg-white rounded-3xl p-8 lg:p-10">
              <h3 className="text-2xl font-bold text-primary mb-6">在线留言</h3>
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                    placeholder="请输入您的姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">电话</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                    placeholder="请输入您的电话"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">需求类型</label>
                <select className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all">
                  <option>请选择需求类型</option>
                  <option>OEM/ODM合作</option>
                  <option>产品定制</option>
                  <option>代理加盟</option>
                  <option>其他咨询</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">留言内容</label>
                <textarea
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all resize-none"
                  rows={4}
                  placeholder="请描述您的需求..."
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full btn-accent text-lg py-4"
              >
                提交咨询
              </button>
            </form>
            </div>

            {/* WeChat QR Code */}
            <div className="bg-white rounded-3xl p-8 lg:p-10 text-center">
              <h3 className="text-2xl font-bold text-primary mb-6">扫码咨询</h3>
              <div className="flex flex-col items-center">
                <div className="w-48 h-48 bg-white rounded-2xl overflow-hidden shadow-lg mb-4 flex items-center justify-center">
                  <img
                    src="/wechat-qr.png"
                    alt="微信二维码"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-gray-600 font-medium">扫码添加微信</p>
                <p className="text-gray-500 text-sm mt-1">为您提供专业咨询服务</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="bg-dark text-white py-16">
      <div className="container-custom">
        <div className="grid lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img src="/huafeng-logo.png" alt="华丰电梯" className="h-12 w-auto" />
              <div>
                <span className="text-xl font-bold">华丰电梯</span>
                <p className="text-xs text-white/50">智能制造工厂</p>
              </div>
            </div>
            <p className="text-white/60 mb-6">
              华丰十年坚持，深耕不辍，成长为整梯OEM、ODM的领航者
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-6">快速链接</h4>
            <ul className="space-y-3">
              {['首页', '关于华丰', '制造实力', '专属定制', '产品中心'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-white/60 hover:text-gold transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold mb-6">产品系列</h4>
            <ul className="space-y-3">
              {['H100 曳引钢丝绳电梯', 'H200PRO 强驱观光电梯', 'H300 曳引钢带电梯', 'H400MINI 平台电梯', 'H700 层悦系列'].map((item) => (
                <li key={item}>
                  <a href="#products" className="text-white/60 hover:text-gold transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-6">联系方式</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-white/60">
                <MapPin className="w-5 h-5 text-gold flex-shrink-0" />
                <span>苏州市高新区华桥路168号</span>
              </li>
              <li className="flex items-center gap-3 text-white/60">
                <User className="w-5 h-5 text-gold flex-shrink-0" />
                <span>吴先生</span>
              </li>
              <li className="flex items-center gap-3 text-white/60">
                <Phone className="w-5 h-5 text-gold flex-shrink-0" />
                <span>18362618220</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm">
            © 2024 华丰电梯智能制造工厂. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-white/40 hover:text-gold text-sm transition-colors">隐私政策</a>
            <a href="#" className="text-white/40 hover:text-gold text-sm transition-colors">服务条款</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main App
function App() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      <AboutSection />
      <ManufacturingSection />
      <CustomizationSection />
      <ProductsSection />
      <ContactSection />
      <Footer />
    </div>
  );
}

export default App;
