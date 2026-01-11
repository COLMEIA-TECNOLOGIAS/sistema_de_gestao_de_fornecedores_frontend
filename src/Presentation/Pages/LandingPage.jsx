import React, { useState, useEffect } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';

const LandingPage = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {/* Header */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-3' : 'bg-white py-4'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center">
                            <img
                                src="/logo.svg"
                                alt="MOSAP3"
                                className="h-16 w-auto"
                            />
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center flex-1 justify-center gap-8">
                            <button
                                onClick={() => scrollToSection('inicio')}
                                className="text-gray-700 hover:text-[#44B16F] transition-colors font-medium"
                            >
                                Início
                            </button>
                            <button
                                onClick={() => scrollToSection('sobre-nos')}
                                className="text-gray-700 hover:text-[#44B16F] transition-colors font-medium"
                            >
                                Sobre nós
                            </button>
                            <button
                                onClick={() => scrollToSection('areas-interesse')}
                                className="text-gray-700 hover:text-[#44B16F] transition-colors font-medium"
                            >
                                Áreas de interesse
                            </button>
                        </nav>

                        {/* CTA Button */}
                        <button
                            onClick={() => scrollToSection('seja-fornecedor')}
                            className="hidden md:flex px-6 py-2.5 bg-[#44B16F] text-white rounded-lg hover:bg-[#3a9d5f] transition-colors font-medium"
                        >
                            Seja Fornecedor
                        </button>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>

                    {/* Mobile Navigation */}
                    {isMobileMenuOpen && (
                        <nav className="md:hidden mt-4 pb-4 border-t pt-4 space-y-4">
                            <button
                                onClick={() => scrollToSection('inicio')}
                                className="block w-full text-left text-gray-700 hover:text-[#44B16F] transition-colors font-medium"
                            >
                                Início
                            </button>
                            <button
                                onClick={() => scrollToSection('sobre-nos')}
                                className="block w-full text-left text-gray-700 hover:text-[#44B16F] transition-colors font-medium"
                            >
                                Sobre nós
                            </button>
                            <button
                                onClick={() => scrollToSection('areas-interesse')}
                                className="block w-full text-left text-gray-700 hover:text-[#44B16F] transition-colors font-medium"
                            >
                                Áreas de interesse
                            </button>
                            <button
                                onClick={() => scrollToSection('seja-fornecedor')}
                                className="w-full px-6 py-2.5 bg-[#44B16F] text-white rounded-lg hover:bg-[#3a9d5f] transition-colors font-medium"
                            >
                                Seja Fornecedor
                            </button>
                        </nav>
                    )}
                </div>
            </header>

            {/* Hero Section */}
            <section id="inicio" className="pt-28 pb-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
                            Torne-se um Fornecedor<br />da Mosap3
                        </h1>
                        <p className="text-gray-600 text-lg mb-8 leading-relaxed font-light">
                            Quer fornecer produtos ou serviços para a nossa empresa? Preencha o
                            formulário abaixo e manifeste o seu interesse. A nossa equipa analisará o
                            seu perfil e entrará em contacto caso exista necessidade.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => scrollToSection('seja-fornecedor')}
                                className="px-8 py-3.5 bg-[#44B16F] text-white rounded-lg hover:bg-[#3a9d5f] transition-all duration-300 font-medium flex items-center gap-2 shadow-lg shadow-[#44B16F]/25 hover:shadow-xl hover:shadow-[#44B16F]/30"
                            >
                                Seja Fornecedor
                                <ArrowRight size={18} />
                            </button>
                            <button
                                onClick={() => scrollToSection('sobre-nos')}
                                className="px-8 py-3.5 text-gray-700 hover:text-[#44B16F] transition-colors font-medium"
                            >
                                Saber mais
                            </button>
                        </div>
                    </div>

                    {/* Dashboard Preview */}
                    <div className="max-w-5xl mx-auto">
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            {/* Browser Header */}
                            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                </div>
                                <div className="flex-1 mx-4">
                                    <div className="bg-white rounded-lg px-4 py-1.5 text-sm text-gray-500 border border-gray-200 max-w-md">
                                        mosap3.ao/dashboard
                                    </div>
                                </div>
                            </div>

                            {/* Dashboard Content Mockup */}
                            <div className="flex">
                                {/* Sidebar */}
                                <div className="w-56 bg-white border-r border-gray-100 p-4 hidden md:block">
                                    <div className="flex items-center gap-2 mb-8">
                                        <img src="/logo.svg" alt="MOSAP3" className="h-8" />
                                    </div>
                                    <nav className="space-y-2">
                                        <div className="flex items-center gap-3 px-3 py-2 text-gray-600 text-sm">
                                            <div className="w-5 h-5 bg-gray-300 rounded"></div>
                                            Dashboard
                                        </div>
                                        <div className="flex items-center gap-3 px-3 py-2 bg-[#44B16F]/10 text-[#44B16F] rounded-lg text-sm font-medium">
                                            <div className="w-5 h-5 bg-[#44B16F] rounded"></div>
                                            Fornecedores / Cotações
                                        </div>
                                        <div className="flex items-center gap-3 px-3 py-2 text-gray-600 text-sm">
                                            <div className="w-5 h-5 bg-gray-300 rounded"></div>
                                            Usuários
                                        </div>
                                        <div className="flex items-center gap-3 px-3 py-2 text-gray-600 text-sm">
                                            <div className="w-5 h-5 bg-gray-300 rounded"></div>
                                            Relatórios
                                        </div>
                                        <div className="flex items-center gap-3 px-3 py-2 text-gray-600 text-sm">
                                            <div className="w-5 h-5 bg-gray-300 rounded"></div>
                                            Configurações
                                        </div>
                                    </nav>
                                </div>

                                {/* Main Content */}
                                <div className="flex-1 p-6 bg-gray-50">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 flex items-center gap-2 text-gray-400 text-sm w-64">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                Search for anything...
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-gray-700">António Miranda</span>
                                            <span className="text-xs text-gray-400">Super Admin</span>
                                            <div className="w-8 h-8 bg-[#44B16F] rounded-full"></div>
                                        </div>
                                    </div>

                                    {/* Content Card */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                        <div className="flex items-start justify-between mb-6">
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-900 mb-1">Fornecedores</h3>
                                                <p className="text-gray-500 text-sm">Gerencie os fornecedores cadastrados</p>
                                            </div>
                                            <div className="w-40 h-16 bg-gradient-to-r from-green-600 to-green-400 rounded-lg overflow-hidden">
                                                <img src="/planta.png" alt="" className="w-full h-full object-cover opacity-80" />
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 flex items-center gap-2 text-gray-400 text-sm flex-1 max-w-xs">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                Search for anything...
                                            </div>
                                            <button className="px-4 py-2 bg-[#44B16F] text-white text-sm rounded-lg font-medium flex items-center gap-2">
                                                + Solicitar cotação
                                            </button>
                                            <button className="px-4 py-2 bg-[#44B16F] text-white text-sm rounded-lg font-medium flex items-center gap-2">
                                                📁 Categorias ▾
                                            </button>
                                            <button className="px-4 py-2 bg-[#44B16F] text-white text-sm rounded-lg font-medium flex items-center gap-2">
                                                📊 Atividade
                                            </button>
                                        </div>

                                        {/* Table */}
                                        <div className="overflow-hidden rounded-lg border border-gray-100">
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                    <tr className="text-left text-xs text-gray-500 font-medium">
                                                        <th className="px-4 py-3">ID</th>
                                                        <th className="px-4 py-3">Nome da empresa</th>
                                                        <th className="px-4 py-3">Data de registo</th>
                                                        <th className="px-4 py-3">Província</th>
                                                        <th className="px-4 py-3">Atividade</th>
                                                        <th className="px-4 py-3">Avaliação de qualidade</th>
                                                        <th className="px-4 py-3">Categoria</th>
                                                        <th className="px-4 py-3">Acções</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    <tr className="text-sm">
                                                        <td className="px-4 py-3 text-gray-500">☐</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">QD</div>
                                                                <span className="font-medium text-gray-900">NCR Angola</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600">17/07/2025</td>
                                                        <td className="px-4 py-3 text-gray-600">Luanda</td>
                                                        <td className="px-4 py-3 text-gray-600">P. de serviços</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                    <div className="w-1/6 h-full bg-red-400"></div>
                                                                </div>
                                                                <span className="text-red-500 text-xs">10%</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="px-2 py-1 bg-[#44B16F] text-white text-xs rounded">Eletrónicos</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-400">⋮</td>
                                                    </tr>
                                                    <tr className="text-sm">
                                                        <td className="px-4 py-3 text-gray-500">☐</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-600">ST</div>
                                                                <span className="font-medium text-gray-900">SISTEC</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600">17/07/2025</td>
                                                        <td className="px-4 py-3 text-gray-600">Luanda</td>
                                                        <td className="px-4 py-3 text-gray-600">P. de Serviços</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                    <div className="w-[97%] h-full bg-[#44B16F]"></div>
                                                                </div>
                                                                <span className="text-[#44B16F] text-xs">97%</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">—</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-400">⋮</td>
                                                    </tr>
                                                    <tr className="text-sm">
                                                        <td className="px-4 py-3 text-gray-500">☐</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">NC</div>
                                                                <span className="font-medium text-gray-900">NCR Angola</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600">17/07/2025</td>
                                                        <td className="px-4 py-3 text-gray-600">Luanda</td>
                                                        <td className="px-4 py-3 text-gray-600">P. de Serviços</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                    <div className="w-[65%] h-full bg-yellow-400"></div>
                                                                </div>
                                                                <span className="text-yellow-500 text-xs">65%</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="px-2 py-1 bg-[#44B16F] text-white text-xs rounded">Eletrónicos</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-400">⋮</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sobre Nós Section */}
            <section id="sobre-nos" className="py-20 bg-[#f0f5f3]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Text Content */}
                        <div>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">
                                Sobre Nós
                            </h2>
                            <p className="text-gray-600 text-lg leading-relaxed mb-8 font-light">
                                A Mosap3 atua no fortalecimento da produção agropecuária familiar
                                em Angola, promovendo práticas sustentáveis e apoio aos
                                produtores locais. Trabalhamos com fornecedores comprometidos
                                com qualidade, responsabilidade e soluções que contribuam para o
                                desenvolvimento rural.
                            </p>
                            <button
                                onClick={() => scrollToSection('areas-interesse')}
                                className="px-6 py-3 bg-[#44B16F] text-white rounded-lg hover:bg-[#3a9d5f] transition-colors font-medium"
                            >
                                Saber mais
                            </button>
                        </div>

                        {/* Image Composition - Exatamente como na referência */}
                        <div className="relative">
                            <div className="relative w-full h-[500px]">
                                {/* Imagem grande à esquerda - folhas com gota de água (desfocada/opaca) */}
                                <div className="absolute left-0 top-8 w-72 h-[420px] overflow-hidden">
                                    <img
                                        src="/planta.png"
                                        alt="Planta"
                                        className="w-full h-full object-cover opacity-40 grayscale-[30%]"
                                        style={{ filter: 'saturate(0.5) brightness(1.1)' }}
                                    />
                                </div>

                                {/* Imagem principal central - Monstera nítida */}
                                <div className="absolute left-32 top-24 w-72 h-80 z-20">
                                    <img
                                        src="/planta.png"
                                        alt="Planta Monstera"
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Imagem superior direita - tom claro/azulado */}
                                <div className="absolute right-8 top-4 w-44 h-40 overflow-hidden">
                                    <img
                                        src="/planta.png"
                                        alt="Planta"
                                        className="w-full h-full object-cover opacity-50"
                                        style={{ filter: 'saturate(0.3) brightness(1.3) hue-rotate(20deg)' }}
                                    />
                                </div>

                                {/* Imagem inferior direita - tom azulado/verde escuro */}
                                <div className="absolute right-0 bottom-12 w-48 h-52 overflow-hidden">
                                    <img
                                        src="/planta.png"
                                        alt="Planta"
                                        className="w-full h-full object-cover opacity-60"
                                        style={{ filter: 'saturate(0.4) brightness(0.9) hue-rotate(160deg)' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* O que Procuramos Section */}
            <section id="areas-interesse" className="py-20 bg-white relative overflow-hidden">
                {/* Decorative geometric elements - left side */}
                <div className="absolute left-0 top-20 w-24 opacity-30">
                    <div className="grid grid-cols-3 gap-2">
                        {[...Array(9)].map((_, i) => (
                            <div
                                key={i}
                                className="w-4 h-4 bg-[#44B16F] rounded-sm"
                                style={{ opacity: 0.3 + (i * 0.08) }}
                            ></div>
                        ))}
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                            O que Procuramos em Fornecedores
                        </h2>
                        <p className="text-gray-600 max-w-xl mx-auto font-light">
                            Buscamos fornecedores que ofereçam soluções confiáveis e de
                            qualidade para apoiar nossas operações
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4">
                        {/* Left Column - Produtos e serviços que buscamos */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-6 text-center">
                                Produtos e serviços que buscamos
                            </h3>
                            <div className="space-y-4">
                                {[
                                    'Produtos de qualidade',
                                    'Serviços especializados',
                                    'Cumprimento de prazos',
                                    'Documentação regularizada'
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full border-2 border-[#44B16F]/30 bg-[#44B16F]/5 flex items-center justify-center text-[#44B16F] font-semibold text-sm">
                                            {index + 1}
                                        </div>
                                        <span className="text-gray-700">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column - Áreas de interesse */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-6 text-center">
                                Áreas de interesse
                            </h3>
                            <div className="space-y-4">
                                {[
                                    'Serviços Eletrónicos',
                                    'Tecnologia',
                                    'Tecnologia',
                                    'Tecnologia'
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full border-2 border-[#44B16F]/30 bg-[#44B16F]/5 flex items-center justify-center text-[#44B16F] font-semibold text-sm">
                                            {index + 1}
                                        </div>
                                        <span className="text-gray-700">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Como se Tornar Fornecedor Section */}
            <section id="seja-fornecedor" className="py-32 bg-[#f0f5f3] relative overflow-hidden min-h-[500px]">
                {/* Decorative geometric elements - right side */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-32 opacity-40">
                    <div className="grid grid-cols-4 gap-1">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="w-3 h-3 bg-[#00B4D8] rounded-sm"
                                style={{ opacity: 0.4 + (Math.random() * 0.4) }}
                            ></div>
                        ))}
                    </div>
                </div>

                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center">
                        {/* Icon */}
                        <div className="mb-8">
                            <div className="w-20 h-20 mx-auto bg-[#44B16F] rounded-full flex items-center justify-center shadow-lg">
                                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                            Como se Tornar Fornecedor?
                        </h2>
                        <p className="text-gray-600 mb-10 max-w-lg mx-auto leading-relaxed font-light">
                            Manifeste o seu interesse e junte-se à nossa rede de
                            parceiros. Envie os seus dados e participe nas nossas
                            oportunidades de fornecimento.
                        </p>

                        <button
                            onClick={() => window.location.href = '/register'}
                            className="px-10 py-4 bg-[#44B16F] text-white rounded-lg hover:bg-[#3a9d5f] transition-all duration-300 font-medium inline-flex items-center gap-2 shadow-lg shadow-[#44B16F]/25 hover:shadow-xl hover:shadow-[#44B16F]/30"
                        >
                            Manifestar Interesse
                            <ArrowRight size={18} />
                        </button>

                        <p className="text-gray-500 text-sm mt-8">
                            As informações enviadas serão analisadas pela
                            nossa equipa.
                        </p>
                    </div>
                </div>
            </section>


        </div>
    );
};

export default LandingPage;
