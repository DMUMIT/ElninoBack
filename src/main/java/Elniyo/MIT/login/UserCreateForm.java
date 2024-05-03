package Elniyo.MIT.login;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Valid
public class UserCreateForm {

    @Size(min = 3, max = 25)
    @NotEmpty(message = "필수입력 항목 입니다.")
    private String username;

    @NotEmpty(message = "비밀번호는 필수입력 사항입니다.")
    private String password1;

    @NotEmpty(message = "비밀번호를 재확인 해주세요")
    private String password2;

    @NotEmpty(message = "이메일을 입력해 주세요")
    @Email
    private String email;


}
