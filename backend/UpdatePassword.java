import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class UpdatePassword {
    public static void main(String[] args) throws Exception {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode("NovaCartAdmin2026!");
        
        System.out.println("New hash generated: " + hash);
        
        Connection conn = DriverManager.getConnection("jdbc:postgresql://localhost:5432/novacart", "postgres", "test@123");
        PreparedStatement stmt = conn.prepareStatement("UPDATE users SET password_hash = ? WHERE email = ?");
        stmt.setString(1, hash);
        stmt.setString(2, "admin@novacart.app");
        int rows = stmt.executeUpdate();
        
        System.out.println("Rows updated: " + rows);
        conn.close();
    }
}
