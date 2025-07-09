import '../../assets/styles.css';

const Button = ({ children, onClick, variant = 'primary' }) => {
    return (
        <button className={`button button-${variant}`} onClick={onClick}>
            {children}
        </button>
    );
};

export default Button;
