
import React, { useState, useEffect } from 'react'
import { X, FileText, Download, AlertCircle } from 'lucide-react'

const InputModal = ({ isOpen, onClose, onConfirm, inputs, requiredInputs = [], title, defaults = {} }) => {
    // inputs: ['studentName', 'reason', etc]
    const [formData, setFormData] = useState({})
    const [errors, setErrors] = useState({})

    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({ ...prev, ...defaults }))
            setErrors({})
        } else {
            setFormData({}) // Clear on close
            setErrors({})
        }
    }, [isOpen, defaults])

    if (!isOpen) return null

    const validate = () => {
        const newErrors = {}
        let isValid = true

        requiredInputs.forEach(field => {
            const value = formData[field]
            if (!value || value.trim().length === 0) {
                newErrors[field] = 'Bu alan zorunludur.'
                if (field === 'studentName') {
                    newErrors[field] = 'Öğrenci adı zorunlu.'
                }
                isValid = false
            }
        })

        setErrors(newErrors)
        return isValid
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (validate()) {
            onConfirm(formData)
        }
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
        // Clear error on type
        if (errors[e.target.name]) {
            setErrors(prev => ({ ...prev, [e.target.name]: null }))
        }
    }

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
            <div
                className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-400" />
                        {title || 'Ek Bilgiler'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <p className="text-sm text-gray-500 mb-2">
                            Bu belge için aşağıdaki bilgileri ekleyebilirsiniz (opsiyonel).
                        </p>

                        {inputs.map(field => {
                            let label = field
                            let placeholder = ''

                            // Simple mapping for display
                            if (field === 'studentName') {
                                label = 'Öğrenci Adı'
                                placeholder = 'Örn: Ali Veli'
                            }

                            const isRequired = requiredInputs.includes(field)
                            const hasError = !!errors[field]

                            return (
                                <div key={field}>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        {label} {isRequired && <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                        type="text"
                                        name={field}
                                        value={formData[field] || ''}
                                        onChange={handleChange}
                                        placeholder={placeholder}
                                        autoFocus={field === inputs[0]}
                                        className={`
                                            w-full px-3 py-2 bg-white border rounded-xl text-sm text-gray-900 
                                            focus:outline-none focus:ring-2 transition-all
                                            ${hasError
                                                ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
                                                : 'border-gray-200 focus:ring-blue-100 focus:border-blue-300'
                                            }
                                        `}
                                    />
                                    {hasError && (
                                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors[field]}
                                        </p>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200/50 rounded-xl transition-colors"
                        >
                            Vazgeç
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            İndir
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default InputModal
