import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function Login() {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password === process.env.REACT_APP_PASSWORD || password === process.env.REACT_APP_ADMIN_PASSWORD) {
            localStorage.setItem('authToken', password);
            navigate('/PuntoDeVenta');
        } else {
            alert('Credenciales incorrectas');
        }
    };

    return (
        <div className="container mt-5 d-flex justify-content-center">
            <div className="card col-12 col-md-6 col-lg-4 p-4">
                <h2 className='text-center mb-3'>Login</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3 position-relative">
                        <div className="mb-3">
                            <div className="input-group">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-control"
                                    id="password"
                                    placeholder='Contraseña'
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary w-100">Iniciar Sesión</button>
                </form>
            </div>
        </div>
    );
}

export default Login;
